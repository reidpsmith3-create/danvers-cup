import Link from "next/link";
import CourseForm from "@/components/admin/CourseForm";

export default function NewCoursePage() {
  return (
    <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/admin/courses"
          className="text-xs font-bold uppercase tracking-[0.2em] text-danvers-gold"
        >
          ← Courses
        </Link>

        <div className="mt-6 rounded-[2rem] border border-danvers-green/30 bg-danvers-surface/80 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-danvers-gold">
            Admin
          </p>
          <h1 className="mt-2 text-4xl font-black">New Course</h1>
        </div>

        <div className="mt-6">
          <CourseForm />
        </div>
      </section>
    </main>
  );
}