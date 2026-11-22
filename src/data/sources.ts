export interface Source {
  id: string;
  title: string;
  url: string;
  checked: string;
  use: string;
}

export const sourceList: Source[] = [
  {
    id: "nist63b",
    title: "NIST SP 800-63B-4, Authentication and Authenticator Management",
    url: "https://pages.nist.gov/800-63-4/sp800-63b/authenticators/",
    checked: "2026-11-19",
    use: "Kalau cuma kata sandi, minimal 15 karakter. Kalau ada kode kedua, minimal 8 karakter. Layanan tidak boleh paksa campuran huruf, angka, dan simbol. Layanan tidak boleh minta ganti kata sandi secara berkala. Layanan wajib minta ganti kalau ada tanda bocor.",
  },
  {
    id: "nist63faq",
    title: "NIST SP 800-63-4 Implementation Resources, FAQ",
    url: "https://pages.nist.gov/800-63-4-Implementation-Resources/faqs/",
    checked: "2026-11-19",
    use: "Layanan harus izinkan pengelola kata sandi dan isian otomatis.",
  },
  {
    id: "csfAt",
    title: "NIST Cybersecurity Framework 2.0, PR.AT-01",
    url: "https://www.nist.gov/cyberframework",
    checked: "2026-11-19",
    use: "Orang perlu bisa kenali tipuan lewat cerita, lapor hal yang mencurigakan, dan jaga kode masuk.",
  },
  {
    id: "csfAa",
    title: "NIST Cybersecurity Framework 2.0, PR.AA-03",
    url: "https://www.nist.gov/cyberframework",
    checked: "2026-11-19",
    use: "Orang yang masuk harus terbukti memang dia. Halaman ini memakai itu sebagai alasan untuk kode kedua di akun penting.",
  },
  {
    id: "iso517",
    title: "ISO/IEC 27002:2022, kontrol 5.17 Authentication information",
    url: "https://www.iso.org/standard/75652.html",
    checked: "2026-11-19",
    use: "Judul kontrol untuk cara kelola info masuk akun. Teks standar tidak disalin.",
  },
  {
    id: "iso85",
    title: "ISO/IEC 27002:2022, kontrol 8.5 Secure authentication",
    url: "https://www.iso.org/standard/75652.html",
    checked: "2026-11-19",
    use: "Judul kontrol untuk cara masuk yang sesuai risikonya. Teks standar tidak disalin.",
  },
  {
    id: "iso63",
    title: "ISO/IEC 27002:2022, kontrol 6.3 Information security awareness, education and training",
    url: "https://www.iso.org/standard/75652.html",
    checked: "2026-11-19",
    use: "Judul kontrol untuk kesadaran. Teks standar tidak disalin.",
  },
  {
    id: "iso534",
    title: "ISO/IEC 27002:2022, kontrol 5.34 Privacy and protection of PII",
    url: "https://www.iso.org/standard/75652.html",
    checked: "2026-11-19",
    use: "Judul kontrol untuk privasi dan data pribadi. Teks standar tidak disalin.",
  },
  {
    id: "iso514",
    title: "ISO/IEC 27002:2022, kontrol 5.14 Information transfer",
    url: "https://www.iso.org/standard/75652.html",
    checked: "2026-11-19",
    use: "Judul kontrol untuk pindah informasi. Teks standar tidak disalin.",
  },
  {
    id: "iso87",
    title: "ISO/IEC 27002:2022, kontrol 8.7 Protection against malware",
    url: "https://www.iso.org/standard/75652.html",
    checked: "2026-11-19",
    use: "Judul kontrol untuk jaga dari aplikasi jahat. Teks standar tidak disalin.",
  },
  {
    id: "uupdp",
    title: "Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi",
    url: "https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022",
    checked: "2026-11-19",
    use: "Pasal 1 angka 4: pengendali menentukan tujuan dan mengendalikan pemakaian data. Pasal 2 ayat (2): undang-undang ini tidak berlaku untuk pemakaian data oleh orang dalam kegiatan pribadi atau rumah tangga. Pasal 35: pengendali wajib jaga data yang ia pakai. Pasal 46 ayat (1): kalau penjagaan gagal, pengendali memberi tahu secara tertulis paling lambat 3 x 24 jam kepada orang yang datanya bocor dan kepada lembaga.",
  },
  {
    id: "iasc",
    title: "Indonesia Anti-Scam Centre, OJK",
    url: "https://iasc.ojk.go.id/",
    checked: "2026-11-19",
    use: "Jalur resmi untuk lapor penipuan transaksi keuangan. Laporan ini tidak menggantikan laporan polisi.",
  },
  {
    id: "sipasti",
    title: "SIPASTI, Satgas PASTI OJK",
    url: "https://sipasti.ojk.go.id/",
    checked: "2026-11-19",
    use: "Jalur resmi untuk lapor investasi atau pinjaman yang diduga ilegal.",
  },
];

export const sourceIds = sourceList.map((source) => source.id);

export function sourceById(id: string): Source {
  const source = sourceList.find((item) => item.id === id);
  if (!source) {
    throw new Error(`Unknown source id: ${id}`);
  }
  return source;
}
