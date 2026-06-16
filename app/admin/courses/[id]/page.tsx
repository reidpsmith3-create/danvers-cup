import Link from "next/link";
import CourseForm from "@/components/admin/CourseForm";
import { supabase } from "@/lib/supabase";

type EditCoursePageProps = {
  params: {
    id: string;
  };
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!course) {
    return (
      <main className="min-h-screen px-5 pb-24 pt-6 text-danvers-text">
        <section className="mx-auto max-w-3xl">
          <Link href="/admin/courses" className="text-danvers-muted">
            ← Courses
          </Link>
          <h1 className="mt-6 text-4xl font-black">Course not found</h1>
        </section>
      </main>
    );
  }

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
          <h1 className="mt-2 text-4xl font-black">Edit Course</h1>
          <p className="mt-3 text-sm text-danvers-muted">
            Update course details for {course.name}.
          </p>
        </div>

        <div className="mt-6">
          <CourseForm course={course} />
        </div>
      </section>
    </main>
  );
}