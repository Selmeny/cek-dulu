export const roles = [
  {
    id: "ponsel",
    title: "Pemakai ponsel",
    line: "Kamu pakai WhatsApp, telepon, atau SMS.",
    start: ["kode-whatsapp", "nomor-keluarga", "tautan-hadiah"],
  },
  {
    id: "uang",
    title: "Kamu pegang uang digital",
    line: "Kamu transfer, scan QRIS, atau lihat tawaran uang.",
    start: ["transfer-mendesak", "tautan-hadiah", "belanja-daring"],
  },
  {
    id: "penjual",
    title: "Kamu jual atau simpan data orang",
    line: "Kamu terima pesanan, alamat, atau nomor pembeli.",
    start: ["data-orang-lain", "belanja-daring", "kata-sandi"],
  },
  {
    id: "pelajar",
    title: "Pelajar atau mahasiswa",
    line: "Kamu punya akun sekolah, tugas, dan media sosial.",
    start: ["kata-sandi", "jejak-akun", "kode-whatsapp"],
  },
  {
    id: "ortu",
    title: "Orang tua",
    line: "Kamu jaga anak dan nama keluarga di chat.",
    start: ["nomor-keluarga", "jejak-akun", "kode-whatsapp"],
  },
] as const;

export type RoleId = (typeof roles)[number]["id"];

export function roleById(id: string) {
  return roles.find((role) => role.id === id);
}
