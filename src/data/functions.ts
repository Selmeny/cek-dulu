export const groups = [
  {
    id: "sedang",
    href: "/sedang-terjadi",
    title: "Sedang terjadi",
    nav: "Sedang terjadi",
    line: "Pilih yang lagi terjadi. Lakukan satu hal.",
  },
  {
    id: "sekali",
    href: "/lakukan-sekali",
    title: "Lakukan sekali",
    nav: "Lakukan sekali",
    line: "Siapkan ini sebelum ada masalah. Lakukan satu hal.",
  },
] as const;

export const groupIds = ["sedang", "sekali"] as const;

export type GroupId = (typeof groupIds)[number];

export const doors = [
  ...groups,
  {
    id: "cek",
    href: "/cek",
    title: "Cek singkat",
    nav: "Cek singkat",
    line: "Delapan pertanyaan. Hasilnya cuma yang belum kamu lakukan.",
  },
  {
    id: "peran",
    href: "/peran",
    title: "Menurut peran",
    nav: "Peran",
    line: "Pilih kegiatan kamu hari ini. Halaman itu yang cocok untuk kamu.",
  },
] as const;

export type DoorId = (typeof doors)[number]["id"];

export function doorById(id: DoorId) {
  const door = doors.find((item) => item.id === id);
  if (!door) {
    throw new Error(`Unknown function: ${id}`);
  }
  return door;
}
