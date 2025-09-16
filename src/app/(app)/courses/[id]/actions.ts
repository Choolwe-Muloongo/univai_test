'use server';

import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Course, type Lesson } from "@/lib/data";

export async function getCourseAndLessons(courseId: string): Promise<{ course: Course | null, lessons: Lesson[] }> {
    try {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
            return { course: null, lessons: [] };
        }

        const course = { id: courseSnap.id, ...courseSnap.data() } as Course;

        const lessonsRef = collection(db, 'courses', courseId, 'lessons');
        const lessonsSnap = await getDocs(lessonsRef);
        const lessons = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));

        return { course, lessons };
    } catch (error) {
        console.error("Error fetching course and lessons:", error);
        throw new Error("Failed to fetch course data.");
    }
}
