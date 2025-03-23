"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
    const { userId } = await auth();
    if(!userId) throw new Error("Not authenticated");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    })

    if(!user) throw new Error("User not found");

    try {
        const result = await db.$transaction(
            async (tx) => {
                let industryInsight = await tx.industryInsight.findUnique({
                    where: {
                        industry: data.industry
                    }
                })
                if(!industryInsight) {
                    const insights = await generateAIInsights(data.industry);
                    industryInsight = await db.industryInsight.create({
                        data: {
                            industry: data.industry,
                            ...insights,
                            nextUpdate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
                        }
                    });
                }
                const updatedUser = await tx.user.update({
                    where: { id: user.id },
                    data: {
                        industry: data.industry,
                        experience: data.experience,
                        bio: data.bio,
                        skills: data.skills,
                    },
                });
                return { user: updatedUser, industryInsight };
            },
            {
                timeout: 10000
            }
        );
        return {success: true, ...result};
    } catch (error) {
        console.error("Error updating user and industry: ", error.message);
        throw new Error("Failed to update profile" + error.message);
    }
}

export async function getUserOnboardingStatus() {
    const { userId } = await auth();
    if(!userId) throw new Error("Not authenticated");

    const user = await db.user.findUnique({
        where: { clerkUserId: userId }
    })

    if(!user) throw new Error("User not found");

    try {
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
            select: {
                industry: true,
            },
        })
        return {
            isOnboarded: !!user?.industry
        };
    } catch (error) {
        console.error("Error getting user onboarding status: ", error.message);
        throw new Error("Failed to get user onboarding status");
    }
}