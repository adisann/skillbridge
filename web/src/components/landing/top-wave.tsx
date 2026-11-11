import React from "react";

/**
 * Latar bergelombang di belakang hero + strip statistik.
 * Beberapa lapisan gelombang biru (terang → gelap) yang diburamkan, sehingga hero
 * menggelap perlahan dengan tepi lembut bergelombang, tanpa garis batas yang tegas.
 * `flip` membalik gelombang ke atas: dipakai di blok penutup (gelap di atas → terang di bawah).
 * Statis (tanpa animasi) dan murni dekoratif.
 */
export function LandingTopWave({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      className={flip ? "landing-top-wave landing-top-wave--flip" : "landing-top-wave"}
      viewBox="0 0 1440 640"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#DCE4F8" d="M0 150C220 70 430 210 700 140S1180 40 1440 120V640H0Z" />
      <path fill="#AFC1F0" d="M0 250C250 180 500 320 780 250S1240 160 1440 240V640H0Z" />
      <path fill="#7C96E6" d="M0 340C280 280 540 400 860 330S1280 260 1440 330V640H0Z" />
      <path fill="#4A6AD4" d="M0 420C300 370 620 470 920 410S1300 360 1440 420V640H0Z" />
      <path fill="#2747B8" d="M0 490C320 455 660 530 980 480S1320 450 1440 490V640H0Z" />
    </svg>
  );
}
