"""
Menambahkan semester per prodi (`semesterProdi`) dan kelompok mata uji PAI (`ujianPAI`)
ke data/kurikulum.json, lalu menulis ulang data/kurikulum.js.

Sumber (folder documents/):
- [MAT]  Tabel 4.2 Distribusi Mata Kuliah Tiap Semester (hlm. 44)
         Tabel 5.2.5 Mata Kuliah Pilihan (semester anjuran, hlm. 109)
- [STAT] Tabel 4.2 Distribusi Mata Kuliah Tiap Semester (hlm. 210).
         MK pilihan Statistika tidak punya semester anjuran.
- [AKTU] Tabel 4.9 & 4.10 Distribusi Mata Kuliah + "Rekomendasi penambahan
         mata kuliah" (hlm. 93-94), Tabel 4.7 Penyetaraan Mata Uji PAI (hlm. 91)

Jalankan dari root proyek:  python parser/apply_semester_prodi.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON_PATH = os.path.join(ROOT, "data", "kurikulum.json")
JS_PATH = os.path.join(ROOT, "data", "kurikulum.js")


def by_semester(table):
    out = {}
    for sem, codes in table.items():
        for code in codes.split():
            out[code] = sem
    return out


SEMESTER_PRODI = {
    "Matematika": by_semester({
        1: "UIGE600003 UIGE600004 SCBI601112 SCST601001 SCMA601001 SCMA601002 SCMA601003 SCMA601047 SCMA601048 SCMA601049",
        2: "UIGE600007 SCPH601110 SCMA601005 SCMA601006 SCMA601007 SCMA601010",
        3: "SCST601002 SCMA602008 SCMA602011 SCMA602009 SCMA602012 SCMA602013 SCMA602050",
        4: "SCST602003 SCMA602014 SCMA602016 SCMA602017 SCMA602020 SCMA602051 SCMA602052",
        5: "SCCH601101 SCMA603015 SCMA603022 SCMA603023 SCMA603024"
           # Pilihan (anjuran)
           " SCMA603125 SCMA603126 SCMA603127 SCMA603128 SCMA603129",
        6: "SCMA603130 SCMA603131 SCMA603132 SCMA603133 SCMA603134 SCMA603135 SCMA603136 SCMA603137 SCMA603138",
        7: "SCMA604021"
           " SCMA604139 SCMA604140 SCMA604141 SCMA604142 SCMA604143 SCMA604144 SCMA604145 SCMA604146",
        8: "SCMA604000",
    }),
    "Statistika": by_semester({
        1: "SCCH601101 SCMA601001 SCMA601002 SCMA601003 SCMA601047 SCMA601048 SCMA601049 SCST601001 UIGE600003 UIGE600004",
        2: "SCMA601005 SCMA601006 SCMA601007 SCPH601110 SCST601002 UIGE600007",
        3: "SCAC602022 SCBI601112 SCST602003 SCST602004 SCST602005 SCST602006 SCST602007 SCST602008",
        4: "SCMA602008 SCST602009 SCST602010 SCST602011 SCST602012 SCST602013 SCST602014 SCST602015",
        5: "SCST603017 SCST603018 SCST603019 SCST603020 SCST603021 SCST603022 SCST603023",
        7: "SCST603016",
        8: "SCST603024",
    }),
    "Ilmu Aktuaria": by_semester({
        1: "UIGE600004 UIGE600003 SCCH601101 SCBI601112 SCMA601001 SCMA601003 SCMA601002 SCMA601047 SCMA601048 SCMA601049",
        2: "UIGE600007 SCPH601110 SCMA601006 SCMA601005 SCMA601007 SCST601001",
        3: "SCMA602008 SCST601002 SCAC602002 SCAC602023 SCAC602033 SCAC602020 SCAC602031"
           " SCAC602134",
        4: "SCST602003 SCST602005 SCAC602024 SCAC602022 SCAC602004 SCAC602005"
           " SCAC602141 SCAC602105",
        5: "SCST602012 SCST602014 SCAC603028 SCAC603035 SCAC603027 SCAC603030 SCAC603032"
           " SCAC603116",
        6: "SCAC603118 SCAC603115 SCAC603109 SCAC603137 SCAC603101 SCAC603138 SCAC603113",
        7: "SCAC603036"
           " SCAC604117 SCAC604112 SCAC604119 SCAC604114 SCAC604139",
        8: "SCAC604040",
    }),
}

UJIAN_PAI = {
    "A10 – Matematika Keuangan": "SCAC602020 SCAC602024",
    "A20 – Probabilitas dan Statistika": "SCST601002 SCST602003",
    "A30 – Ekonomi": "SCAC603116 SCAC603118",
    "A40 – Akuntansi": "SCAC603115 SCAC604117",
    "A50 – Metode Statistika": "SCST602005 SCST602014 SCST602012",
    "A60 – Matematika Aktuaria": "SCAC602004 SCAC603027",
    "A70 – Pemodelan dan Teori Risiko": "SCAC602022 SCAC603028",
}
PAI_BY_CODE = {code: label for label, codes in UJIAN_PAI.items() for code in codes.split()}


def main():
    with open(JSON_PATH, encoding="utf-8") as f:
        courses = json.load(f)
    known = {c["kode"] for c in courses}

    for prodi, table in SEMESTER_PRODI.items():
        missing = sorted(set(table) - known)
        if missing:
            raise SystemExit(f"Kode {prodi} tidak ada di data: {missing}")

    for c in courses:
        sem_prodi = {}
        for prodi in c["prodi"]:
            sem = SEMESTER_PRODI.get(prodi, {}).get(c["kode"])
            if sem is not None:
                sem_prodi[prodi] = sem
        c.pop("semesterProdi", None)
        c.pop("ujianPAI", None)
        if sem_prodi:
            c["semesterProdi"] = sem_prodi
        # Semester umum (dipakai saat "Semua Prodi"): utamakan versi prodi pemilik kode MK
        owner = {"SCMA": "Matematika", "SCST": "Statistika", "SCAC": "Ilmu Aktuaria"}.get(c["kode"][:4])
        if owner in sem_prodi:
            c["semester"] = sem_prodi[owner]
        if c["kode"] in PAI_BY_CODE and "Ilmu Aktuaria" in c["prodi"]:
            c["ujianPAI"] = PAI_BY_CODE[c["kode"]]

    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(courses, f, ensure_ascii=False, indent=2)
    with open(JS_PATH, "w", encoding="utf-8") as f:
        f.write("window.kurikulumData = " + json.dumps(courses, ensure_ascii=False, indent=2) + ";\n")

    print(f"Selesai: {len(courses)} MK, "
          f"{sum('semesterProdi' in c for c in courses)} punya semesterProdi, "
          f"{sum('ujianPAI' in c for c in courses)} punya ujianPAI.")


if __name__ == "__main__":
    main()
