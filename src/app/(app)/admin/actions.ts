'use server';
import { collection, getDocs, doc, writeBatch, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { type School, type Course } from "@/lib/data";
import { revalidatePath } from "next/cache";

// NOTE: In a real app, you'd have more robust validation
export async function addSchool(prevState: any, formData: FormData) {
    const schoolName = formData.get('schoolName') as string;
    if (!schoolName || schoolName.trim().length < 3) {
        return { error: 'School name must be at least 3 characters long.' };
    }
    
    try {
        const schoolId = schoolName.toLowerCase().replace(/\s+/g, '-');
        const batch = writeBatch(db);

        // Add the school
        const schoolRef = doc(db, 'schools', schoolId);
        batch.set(schoolRef, { id: schoolId, name: schoolName });

        await batch.commit();
        revalidatePath('/admin/management');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: 'Failed to add school.' };
    }
}


export async function addCourse(prevState: any, formData: FormData) {
    const courseTitle = formData.get('courseTitle') as string;
    const courseDescription = formData.get('courseDescription') as string;
    const schoolId = formData.get('schoolId') as string;

    if (!courseTitle || !courseDescription || !schoolId) {
        return { error: 'All fields are required.' };
    }

    try {
        const courseRef = await addDoc(collection(db, 'courses'), {
            title: courseTitle,
            description: courseDescription,
            schoolId: schoolId,
            imageId: `${Math.floor(1 + Math.random() * 5)}`,
            createdAt: serverTimestamp(),
        });
        
        // Create initial dummy lessons for the new course
        const batch = writeBatch(db);
        const lesson1Ref = doc(collection(db, `courses/${courseRef.id}/lessons`));
        batch.set(lesson1Ref, { title: 'Lesson 1: Introduction', content: 'Placeholder content for lesson 1.' });
        const lesson2Ref = doc(collection(db, `courses/${courseRef.id}/lessons`));
        batch.set(lesson2Ref, { title: 'Lesson 2: Core Concepts', content: 'Placeholder content for lesson 2.' });
        await batch.commit();

        revalidatePath('/admin/management');
        return { success: true };

    } catch (e) {
        console.error(e);
        return { error: 'Failed to add course.' };
    }
}


export async function getSchoolsAndCourses() {
    try {
        const schoolsSnapshot = await getDocs(collection(db, "schools"));
        const schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as School[];

        const coursesSnapshot = await getDocs(collection(db, "courses"));
        const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Course[];
        
        return { schools, courses };
    } catch (error) {
        console.error("Error fetching schools and courses: ", error);
        return { schools: [], courses: [] };
    }
}

export async function removeSchool(id: string) {
    try {
        // In a real app, you'd handle cascading deletes more carefully, maybe with a cloud function.
        // For now, we just delete the school doc. Associated courses will be orphaned.
        await deleteDoc(doc(db, 'schools', id));
        revalidatePath('/admin/management');
        return { success: true };
    } catch (error) {
        console.error("Error removing school: ", error);
        return { success: false, error: "Failed to remove school." };
    }
}


export async function removeCourse(id: string) {
    try {
        await deleteDoc(doc(db, 'courses', id));
        revalidatePath('/admin/management');
        return { success: true };
    } catch (error) {
        console.error("Error removing course: ", error);
        return { success: false, error: "Failed to remove course." };
    }
}
