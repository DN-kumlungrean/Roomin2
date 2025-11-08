"use client";

import React, { useState, useEffect } from "react";
import { createQRPayment } from "../api/invoice";
import { uploadPaymentSlip } from '../api/receipt';

function PaymentButton({ onClick, children, className }) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#FEB863] hover:bg-[#FEA130] transition-colors px-10 py-3 rounded-full ${className}`}
    >
      <span className="font-normal text-black text-lg">{children}</span>
    </button>
  );
}

export default function PaymentPopup({ onClose, amount, invoiceId }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);

  // สร้าง QR ทันทีเมื่อ popup เปิด
  useEffect(() => {
    if (invoiceId && amount) {
      handleGenerateQR();
    }
  }, [invoiceId, amount]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  //ดึง QR จาก backend
  const handleGenerateQR = async () => {
    setLoadingQR(true);
    try {
      const res = await createQRPayment(invoiceId, amount);
      if (res.success) {
        setQrCode(res.qrCode);
      } else {
        alert("ไม่สามารถสร้าง QR ได้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการสร้าง QR");
    } finally {
      setLoadingQR(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("โปรดเลือกไฟล์ก่อนส่ง");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("invoiceId", invoiceId);
    formData.append("amount", amount); 
    formData.append("date", new Date().toISOString()); 

    try {
        // 1. เรียกใช้ Axios API Client
        const data = await uploadPaymentSlip(formData);

        // 2. จัดการ Success Response
        console.log("Upload success:", data);
        alert(`ส่งหลักฐานสำเร็จ! URL: ${data.receipt.proof}`);
        onClose();

    } catch (err) {
        // 3. จัดการ Error (จาก Axios Client ที่โยน Error มา)
        const errorMessage = err.message || err.error || "อัปโหลดไม่สำเร็จ (โปรดตรวจสอบ Server)";
        alert(`อัปโหลดล้มเหลว: ${errorMessage}`);
        console.error('Upload Error:', err);
    }
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative bg-white rounded-xl w-full max-w-[440px] p-8 shadow-lg">
        {/* ปุ่มปิด */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-gray-600 transition-colors font-semibold text-lg"
        >
          X
        </button>

        {/* Title */}
        <h2 className="text-2xl sm:text-2xl font-bold text-left mb-2">
          ยืนยันการชำระเงิน
        </h2>

        {/* จำนวนเงิน */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-5xl sm:text-6xl font-bold text-[#645278]">
            {amount.toLocaleString("th-TH")}
          </span>
          <span className="text-2xl sm:text-2xl font-bold">บาท</span>
        </div>

        {/* ช่องทางการชำระเงิน */}
        <div className="text-left mb-4">
          <p className="text-xl font-semibold mb-2">ช่องทางการชำระเงิน</p>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-40 h-40 border border-[#645278] rounded-lg flex items-center justify-center overflow-hidden">
              {loadingQR ? (
                <span className="text-gray-500">กำลังโหลด...</span>
              ) : qrCode ? (
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-full h-full object-cover"
                />
              ) : (
                <button
                  onClick={handleGenerateQR}
                  className="text-sm text-[#FEA130]"
                >
                  สร้าง QR Code
                </button>
              )}
            </div>

            <div className="flex flex-col items-start">
              <p className="font-semibold">ชื่อ : ROOMIN</p>
              <p className="font-semibold">เลขบัญชี : 0000000000</p>
              <p className="font-semibold">ธนาคาร : PromptPay</p>
            </div>
          </div>
        </div>

        {/* แนบหลักฐาน */}
        <div className="text-center mb-6">
          <p className="text-xl font-semibold mb-2">แนบหลักฐานการชำระเงิน</p>
          
          {/* ปุ่มอัปโหลดไฟล์ */}
          <div
            className="mx-auto w-48 h-12 border-2 border-[#FEA130] rounded-xl flex items-center justify-center mb-2 cursor-pointer hover:bg-[#FFE6C8] transition-colors"
            onClick={() => document.getElementById("fileInput").click()}
          >
            <span className="text-base font-normal text-[#FEA130]">
              {selectedFile ? selectedFile.name : "อัปโหลดสลิป"}
            </span>
          </div>

          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".jpg,.png"
            onChange={handleFileChange}
          />

          <p className="text-sm text-gray-700">
            โปรดแนบสลิปการโอนเงินเป็นไฟล์ .jpg หรือ .png
          </p>
        </div>

        {/* ปุ่มส่ง/ยกเลิก */}
        <div className="flex justify-center gap-5 mt-6">
          <PaymentButton onClick={handleUpload}>ส่งหลักฐาน</PaymentButton>
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 transition-colors px-8 py-3 rounded-full"
          >
            <span className="text-black font-normal text-lg">ยกเลิก</span>
          </button>
        </div>
      </div>
    </div>
  );
}