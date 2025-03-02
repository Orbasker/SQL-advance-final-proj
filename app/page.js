"use client";

import { useRouter } from 'next/navigation'; // Fix incorrect import
import { useEffect } from 'react';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard'); // Redirect to dashboard
    }, []);

    return null;
}
