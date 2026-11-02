-- KURALLAR (docs/VERITABANI.md)
--
-- Tablo tanimlariyla ifade edilemeyen kurallar: urun kodlarinin tek havuzu,
-- eski linklerin temizligi, filtre degerlerinin kategoriyle uyumu, degisiklik
-- kaydinin korunmasi ve kayit numarasi. Bu betik elle yazilir (drizzle-kit
-- generate --custom); 0000_kurulum.sql semadan uretilir.

-- 1. URUN VE VARYANT KODLARI TEK HAVUZDA (IS-KURALLARI › Urun kodlari)
--    Bosluklar atilip buyuk harfe cevrilerek karsilastirilir.

CREATE FUNCTION zw_normalize_sku(code text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT upper(regexp_replace(code, '\s', '', 'g'))
$$;
--> statement-breakpoint

CREATE FUNCTION zw_products_sku() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM sku_codes WHERE product_id = NEW.id AND variant_id = '';
  BEGIN
    INSERT INTO sku_codes (code, product_id, variant_id) VALUES (zw_normalize_sku(NEW.sku), NEW.id, '');
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Ürün kodu başka bir üründe ya da seçenekte kullanılıyor: %', NEW.sku
      USING ERRCODE = 'unique_violation';
  END;
  RETURN NEW;
END
$$;
--> statement-breakpoint

CREATE TRIGGER products_sku AFTER INSERT OR UPDATE OF sku ON products
FOR EACH ROW EXECUTE FUNCTION zw_products_sku();
--> statement-breakpoint

CREATE FUNCTION zw_variants_sku() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    DELETE FROM sku_codes WHERE product_id = OLD.product_id AND variant_id = OLD.id;
  END IF;
  IF TG_OP = 'DELETE' THEN
    -- Seçeneğe dönüştürülmüş eski ürünün linki bu seçenekle açılıyordu.
    DELETE FROM redirects WHERE target_type = 'product' AND target_id = OLD.product_id AND variant_id = OLD.id;
    RETURN OLD;
  END IF;
  BEGIN
    INSERT INTO sku_codes (code, product_id, variant_id) VALUES (zw_normalize_sku(NEW.sku), NEW.product_id, NEW.id);
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'Ürün kodu başka bir üründe ya da seçenekte kullanılıyor: %', NEW.sku
      USING ERRCODE = 'unique_violation';
  END;
  RETURN NEW;
END
$$;
--> statement-breakpoint

CREATE TRIGGER product_variants_sku AFTER INSERT OR UPDATE OF sku OR DELETE ON product_variants
FOR EACH ROW EXECUTE FUNCTION zw_variants_sku();
--> statement-breakpoint

-- 2. ESKI LINKLER: hedef kayit silinince yonlendirmeleri de silinir.

CREATE FUNCTION zw_delete_redirects() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM redirects WHERE target_type = TG_ARGV[0] AND target_id = OLD.id;
  RETURN OLD;
END
$$;
--> statement-breakpoint

CREATE TRIGGER products_redirects AFTER DELETE ON products
FOR EACH ROW EXECUTE FUNCTION zw_delete_redirects('product');
--> statement-breakpoint
CREATE TRIGGER categories_redirects AFTER DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION zw_delete_redirects('category');
--> statement-breakpoint
CREATE TRIGGER category_groups_redirects AFTER DELETE ON category_groups
FOR EACH ROW EXECUTE FUNCTION zw_delete_redirects('group');
--> statement-breakpoint
CREATE TRIGGER blog_posts_redirects AFTER DELETE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION zw_delete_redirects('blog');
--> statement-breakpoint
CREATE TRIGGER news_redirects AFTER DELETE ON news
FOR EACH ROW EXECUTE FUNCTION zw_delete_redirects('news');
--> statement-breakpoint
CREATE TRIGGER events_redirects AFTER DELETE ON events
FOR EACH ROW EXECUTE FUNCTION zw_delete_redirects('event');
--> statement-breakpoint

-- 3. FILTRE DEGERLERI: yalnizca urunun kendi kategorisinin filtreleri
--    (KARARLAR K-76). Urun baska kategoriye tasininca eski degerler silinir.

CREATE FUNCTION zw_filter_values_category() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND category_id = NEW.category_id) THEN
    RAISE EXCEPTION 'Filtre değeri ürünün kendi kategorisinden olmalı (ürün %)', NEW.product_id
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;
--> statement-breakpoint

CREATE TRIGGER product_filter_values_category BEFORE INSERT OR UPDATE ON product_filter_values
FOR EACH ROW EXECUTE FUNCTION zw_filter_values_category();
--> statement-breakpoint

CREATE FUNCTION zw_products_category_moved() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM product_filter_values WHERE product_id = NEW.id AND category_id <> NEW.category_id;
  RETURN NEW;
END
$$;
--> statement-breakpoint

CREATE TRIGGER products_category_moved AFTER UPDATE OF category_id ON products
FOR EACH ROW WHEN (OLD.category_id IS DISTINCT FROM NEW.category_id)
EXECUTE FUNCTION zw_products_category_moved();
--> statement-breakpoint

-- 4. DEGISIKLIK KAYDI (audit_log): yalnizca eklenir. Degistirilemez, elle
--    silinemez; 2 yildan eski kayitlari yalnizca purge_audit_log() siler
--    (her gun calistirilir; KARARLAR K-81).

CREATE FUNCTION zw_audit_log_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE'
     AND current_setting('zenweld.audit_purge', true) = 'on'
     AND OLD.at < now() - interval '2 years' THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION 'Değişiklik kaydı değiştirilemez ve silinemez'
    USING ERRCODE = 'insufficient_privilege';
END
$$;
--> statement-breakpoint

CREATE TRIGGER audit_log_guard BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION zw_audit_log_guard();
--> statement-breakpoint

CREATE FUNCTION zw_audit_log_no_truncate() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Değişiklik kaydı değiştirilemez ve silinemez'
    USING ERRCODE = 'insufficient_privilege';
END
$$;
--> statement-breakpoint

CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON audit_log
FOR EACH STATEMENT EXECUTE FUNCTION zw_audit_log_no_truncate();
--> statement-breakpoint

CREATE FUNCTION purge_audit_log() RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  removed integer;
BEGIN
  PERFORM set_config('zenweld.audit_purge', 'on', true);
  DELETE FROM audit_log WHERE at < now() - interval '2 years';
  GET DIAGNOSTICS removed = ROW_COUNT;
  PERFORM set_config('zenweld.audit_purge', 'off', true);
  RETURN removed;
END
$$;
--> statement-breakpoint

-- 5. KAYIT NUMARASI (IS-KURALLARI › Kayit numaralari): onek basina son
--    numarayi tek islemde artirip dondurur; ayni anda gelen iki kayit ayni
--    numarayi alamaz. Ornek: SELECT next_record_number('TKL-2026-') -> 50.

CREATE FUNCTION next_record_number(p_prefix text) RETURNS integer
LANGUAGE sql AS $$
  INSERT INTO record_counters (prefix, last_number) VALUES (p_prefix, 1)
  ON CONFLICT (prefix) DO UPDATE SET last_number = record_counters.last_number + 1
  RETURNING last_number
$$;
