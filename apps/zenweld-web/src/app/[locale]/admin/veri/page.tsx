"use client";

import { useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import {
  downloadDatabaseJson,
  importDatabaseJson,
  resetDatabase,
  useDatabase,
} from "@zenweld/store";
import { Alert, Button } from "@zenweld/ui";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminShell";

/**
 * VERI YONETIMI
 *
 * Backend olmadigi icin admin panelde yapilan degisiklikler yalnizca o
 * tarayicinin localStorage'inda durur. Buradan JSON olarak disa aktarip
 * repoya koyarak degisiklikleri kalici (tum ziyaretcilere acik) hale
 * getirebilirsiniz.
 */
export default function AdminDataPage() {
  const db = useDatabase();
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(
    null,
  );

  const counts = [
    { label: "Ürün", value: db.products.length },
    { label: "Kategori", value: db.categories.length },
    { label: "Bayi", value: db.dealers.length },
    { label: "Online Satıcı", value: db.retailers.length },
    { label: "Stok Kaydı (online)", value: db.retailerStock.length },
    { label: "Stok Kaydı (bayi)", value: db.dealerStock.length },
    { label: "Üye", value: db.users.length },
    { label: "Teklif", value: db.quotes.length },
    { label: "Sipariş", value: db.orders.length },
    { label: "Garanti Kaydı", value: db.warranties.length },
  ];

  const onImport = async (file: File) => {
    try {
      await importDatabaseJson(file);
      setMessage({ tone: "success", text: "Veri dosyası başarıyla yüklendi." });
    } catch (err) {
      setMessage({
        tone: "danger",
        text: `Dosya okunamadı: ${err instanceof Error ? err.message : "bilinmeyen hata"}`,
      });
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Veri Yönetimi"
        description="Panelde yaptığınız değişiklikleri yedekleyin, geri yükleyin veya başlangıç verisine dönün."
      />

      {message && (
        <div className="mb-4">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      <Alert tone="warning">
        <strong className="block">Bu değişiklikler nerede saklanıyor?</strong>
        Backend olmadığı için tüm veriler bu tarayıcının yerel deposunda (localStorage) tutulur.
        Başka bir bilgisayarda veya tarayıcıda görünmezler. Değişiklikleri kalıcı hale getirmek
        için JSON dosyasını indirip proje deposundaki seed dosyalarıyla değiştirin.
      </Alert>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <AdminCard>
          <Download size={22} className="text-zw-red-600" />
          <h2 className="mt-3 font-display text-xl font-bold uppercase">JSON Dışa Aktar</h2>
          <p className="mt-1.5 text-sm text-zw-grey-600">
            Tüm veritabanını tek dosya olarak indirin. Günlük stok güncellemesinden sonra bu
            dosyayı yedekleyin.
          </p>
          <Button className="mt-4" onClick={() => downloadDatabaseJson()}>
            Verileri İndir
          </Button>
        </AdminCard>

        <AdminCard>
          <Upload size={22} className="text-zw-red-600" />
          <h2 className="mt-3 font-display text-xl font-bold uppercase">JSON İçe Aktar</h2>
          <p className="mt-1.5 text-sm text-zw-grey-600">
            Daha önce indirdiğiniz yedeği geri yükleyin. Mevcut veriler tamamen değiştirilir.
          </p>
          <label className="mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-[4px] border border-zw-grey-300 px-4 text-sm font-semibold uppercase hover:border-zw-ink">
            <Upload size={16} />
            Dosya Seç
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImport(file);
                e.target.value = "";
              }}
            />
          </label>
        </AdminCard>

        <AdminCard>
          <RotateCcw size={22} className="text-zw-red-600" />
          <h2 className="mt-3 font-display text-xl font-bold uppercase">Başlangıca Dön</h2>
          <p className="mt-1.5 text-sm text-zw-grey-600">
            Tüm değişiklikleri silip projeyle gelen örnek verilere döner. Sunum öncesi temiz
            başlangıç için kullanışlıdır.
          </p>
          <Button
            variant="danger"
            className="mt-4"
            onClick={() => {
              if (confirm("Tüm değişiklikler silinip başlangıç verilerine dönülecek. Emin misiniz?")) {
                resetDatabase();
                setMessage({ tone: "success", text: "Veriler başlangıç haline döndürüldü." });
              }
            }}
          >
            Sıfırla
          </Button>
        </AdminCard>
      </div>

      <AdminCard className="mt-6">
        <h2 className="font-display text-xl font-bold uppercase">Veri Özeti</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {counts.map((c) => (
            <div key={c.label}>
              <div className="font-display text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-zw-grey-600">{c.label}</div>
            </div>
          ))}
        </div>
      </AdminCard>
    </>
  );
}
