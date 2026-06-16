import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  website_url: string | null;
  logo_url: string | null;
};

export default async function AdminCoursesPage() {
  const { data } = await supabase
    .from("courses")
    .select("id, name, city, state, website_url, logo_url")
    .order("name", { ascending: true });

  const courses = (data as Course[] | null) ?? [];

  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Admin
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6 shadow-xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">Courses</h1>

          <p className="mt-3 text-sm leading-6 text-danvers-muted">
            Manage course names, locations, websites, and logos.
          </p>

          <Link
            href="/admin/courses/new"
            className="mt-5 inline-flex rounded-full bg-danvers-gold px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
          >
            New Course
          </Link>
        </div>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="rounded-[2rem] border border-white/10 bg-danvers-surface/80 p-5 transition hover:border-danvers-gold"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-danvers-gold/30 bg-danvers-green/20 text-xl font-black text-danvers-gold">
                  {course.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.logo_url}
                      alt={course.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    course.name.slice(0, 2).toUpperCase()
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-black">{course.name}</h2>

                  <p className="mt-1 text-sm text-danvers-muted">
                    {[course.city, course.state].filter(Boolean).join(", ") ||
                      "Location TBD"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}