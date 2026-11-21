export const groups = [
  {
    id: "sedang",
    href: "/sedang-terjadi",
    title: "Sedang terjadi",
    nav: "Sedang terjadi",
    line: "Pilih kejadian yang sedang berjalan. Lakukan satu hal.",
  },
  {
    id: "sekali",
    href: "/lakukan-sekali",
    title: "Lakukan sekali",
    nav: "Lakukan sekali",
    line: "Siapkan ini sebelum sesuatu terjadi. Lakukan satu hal.",
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
    line: "Delapan pertanyaan. Hasilnya menunjukkan hal yang belum Anda lakukan.",
  },
  {
    id: "peran",
    href: "/peran",
    title: "Menurut peran",
    nav: "Peran",
    line: "Pilih peran Anda hari ini. Halaman itu menunjukkan situasi untuk peran itu.",
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
