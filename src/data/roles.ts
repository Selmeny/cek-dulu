export const roles = [
  {
    id: "ponsel",
    title: "Pemakai ponsel",
    line: "Anda memakai WhatsApp, telepon, atau SMS.",
    start: ["kode-whatsapp", "nomor-keluarga", "tautan-hadiah"],
  },
  {
    id: "uang",
    title: "Anda memegang uang digital",
    line: "Anda transfer, memindai QRIS, atau melihat tawaran uang.",
    start: ["transfer-mendesak", "tautan-hadiah", "belanja-daring"],
  },
  {
    id: "penjual",
    title: "Anda menjual atau menyimpan data orang",
    line: "Anda menerima pesanan, alamat, atau nomor pembeli.",
    start: ["data-orang-lain", "belanja-daring", "kata-sandi"],
  },
  {
    id: "pelajar",
    title: "Pelajar atau mahasiswa",
    line: "Anda punya akun sekolah, tugas, dan media sosial.",
    start: ["kata-sandi", "jejak-akun", "kode-whatsapp"],
  },
  {
    id: "ortu",
    title: "Orang tua",
    line: "Anda menjaga anak dan nama keluarga di chat.",
    start: ["nomor-keluarga", "jejak-akun", "kode-whatsapp"],
  },
] as const;

export type RoleId = (typeof roles)[number]["id"];

export function roleById(id: string) {
  return roles.find((role) => role.id === id);
}
