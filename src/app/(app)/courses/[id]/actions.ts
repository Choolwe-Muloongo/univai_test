'use server';

import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Course, type Lesson, courses, lessons as allLessons } from "@/lib/data";

export async function getCourseAndLessons(courseId: string): Promise<{ course: Course | null, lessons: Lesson[] }> {
    try {
        // Simulate fetching from a database by finding in our mock data
        const course = courses.find(c => c.id === courseId) || null;
        
        if (!course) {
            return { course: null, lessons: [] };
        }

        // In a real app, lessons would be fetched from Firestore.
        // For this demo, we'll use the hardcoded lessons if they exist.
        const lessons = allLessons[courseId as keyof typeof allLessons] || [];

        return { course, lessons };
    } catch (error) {
        console.error("Error fetching course and lessons:", error);
        // We're returning mock data, but keep the error handling structure
        return { course: null, lessons: [] };
    }
}
