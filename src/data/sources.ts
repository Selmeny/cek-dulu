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
    use: "Kata sandi sebagai satu-satunya faktor minimal 15 karakter. Dengan faktor kedua, minimal 8 karakter. Layanan tidak boleh memaksa campuran jenis karakter. Layanan tidak boleh mewajibkan penggantian berkala. Layanan wajib meminta penggantian jika ada tanda kebocoran.",
  },
  {
    id: "nist63faq",
    title: "NIST SP 800-63-4 Implementation Resources, FAQ",
    url: "https://pages.nist.gov/800-63-4-Implementation-Resources/faqs/",
    checked: "2026-11-19",
    use: "Layanan wajib mengizinkan pengelola kata sandi dan isian otomatis.",
  },
  {
    id: "csfAt",
    title: "NIST Cybersecurity Framework 2.0, PR.AT-01",
    url: "https://www.nist.gov/cyberframework",
    checked: "2026-11-19",
    use: "Orang perlu mampu mengenali rekayasa sosial, melaporkan hal yang mencurigakan, dan menjaga kredensial.",
  },
  {
    id: "csfAa",
    title: "NIST Cybersecurity Framework 2.0, PR.AA-03",
    url: "https://www.nist.gov/cyberframework",
    checked: "2026-11-19",
    use: "Pengguna diautentikasi. Halaman ini memakai hasil itu sebagai alasan untuk faktor kedua pada akun penting.",
  },
  {
    id: "iso517",
    title: "ISO/IEC 27002:2022, kontrol 5.17 Authentication information",
    url: "https://www.iso.org/standard/75652.html",
    checked: "2026-11-19",
    use: "Judul kontrol untuk pengelolaan informasi autentikasi. Teks standar tidak disalin.",
  },
  {
    id: "iso85",
    title: "ISO/IEC 27002:2022, kontrol 8.5 Secure authentication",
    url: "https://www.iso.org/standard/75652.html",
    checked: "2026-11-19",
    use: "Judul kontrol untuk autentikasi yang sesuai dengan risiko. Teks standar tidak disalin.",
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
    use: "Judul kontrol untuk pemindahan informasi. Teks standar tidak disalin.",
  },
  {
    id: "iso87",
    title: "ISO/IEC 27002:2022, kontrol 8.7 Protection against malware",
    url: "https://www.iso.org/standard/75652.html",
    checked: "2026-11-19",
    use: "Judul kontrol untuk perlindungan dari perangkat lunak berbahaya. Teks standar tidak disalin.",
  },
  {
    id: "uupdp",
    title: "Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi",
    url: "https://peraturan.bpk.go.id/Details/229798/uu-no-27-tahun-2022",
    checked: "2026-11-19",
    use: "Pasal 1 angka 4: pengendali menentukan tujuan dan mengendalikan pemrosesan. Pasal 2 ayat (2): undang-undang ini tidak berlaku untuk pemrosesan oleh orang perseorangan dalam kegiatan pribadi atau rumah tangga. Pasal 35: pengendali wajib melindungi data yang diprosesnya. Pasal 46 ayat (1): jika pelindungan gagal, pengendali memberitahu secara tertulis paling lambat 3 x 24 jam kepada subjek data dan lembaga.",
  },
  {
    id: "iasc",
    title: "Indonesia Anti-Scam Centre, OJK",
    url: "https://iasc.ojk.go.id/",
    checked: "2026-11-19",
    use: "Jalur resmi untuk laporan penipuan transaksi keuangan. Laporan ini tidak menggantikan laporan polisi.",
  },
  {
    id: "sipasti",
    title: "SIPASTI, Satgas PASTI OJK",
    url: "https://sipasti.ojk.go.id/",
    checked: "2026-11-19",
    use: "Jalur resmi untuk melaporkan investasi atau pinjaman yang diduga ilegal.",
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
