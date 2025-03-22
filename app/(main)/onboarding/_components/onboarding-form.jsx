"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingSchema } from "@/app/lib/schema";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { updateUser } from "@/actions/user";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
  
const OnboardingForm = ({industries}) => {
    const [selectedIndustry, setSelectedIndustry] = useState(null);
    const router = useRouter();

    const {
        loading: updateLoading,
        func: updateUserFunc,
        data: updateResult
    } = useFetch(updateUser);

    const {register, handleSubmit, formState: {errors}, setValue, watch} = useForm({
        resolver: zodResolver(onboardingSchema)
    });

    const watchIndustry = watch("industry");

    const onSubmit = async (values) => {
        try {
            const formattedIndustry = `${values.industry}-${values.subIndustry.toLowerCase().replace(/ /g, "-")}`;
            await updateUserFunc({...values, industry: formattedIndustry});
        } catch (error) {
            console.log("OnboardingForm -> error", error);
        }
    }

    useEffect(() => {
        if(updateResult?.success && !updateLoading) {
            toast.success("Profile updated successfully");
            router.push("/dashboard");
            router.refresh();
        }
    }, [updateResult, updateLoading]);

    return (
        <div className="flex items-center justify-center bg-background">
            <Card className="w-full max-w-lg mt-10 mx-2">
            <CardHeader>
                <CardTitle className="gradient-title text-4xl">Complete your Profile</CardTitle>
                <CardDescription>Select your industry to get personalized career insights and recommendations.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Select
                            onValueChange={(value) => {
                                setValue("industry", value);
                                setSelectedIndustry(
                                    industries.find((industry) => industry.id === value)
                                );
                                setValue("subIndustry", "");
                            }}
                        >
                        <SelectTrigger id="industry">
                            <SelectValue placeholder="Select an Industry" />
                        </SelectTrigger>
                        <SelectContent>
                            {industries.map((industry) => {
                                return <SelectItem value={industry.id} key={industry.id}>{industry.name}</SelectItem>
                            })}
                        </SelectContent>
                        </Select>
                        {errors.industry && <p className="text-red-500 text-sm">{errors.industry.message}</p>}
                    </div>

                    { watchIndustry && (
                        <div className="space-y-2">
                            <Label htmlFor="subIndustry">Specialization</Label>
                            <Select
                                onValueChange={(value) => {
                                    setValue("subIndustry", value);
                                }}
                            >
                            <SelectTrigger id="subIndustry">
                                <SelectValue placeholder="Select an Industry" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedIndustry?.subIndustries.map((industry) => {
                                    return <SelectItem value={industry} key={industry}>{industry}</SelectItem>
                                })}
                            </SelectContent>
                            </Select>
                            {errors.subIndustry && <p className="text-red-500 text-sm">{errors.subIndustry.message}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input 
                            type="number" 
                            min="0" 
                            max="50" 
                            id="experience" 
                            placeholder="Enter your years of experience" 
                            {...register("experience")}
                        />
                        {errors.experience && <p className="text-red-500 text-sm">{errors.experience.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="skills">Skills</Label>
                        <Input
                            id="skills" 
                            placeholder="e.g. Python, React, Data Analysis" 
                            {...register("skills")}
                        />
                        <p className="text-sm text-gray-500">Separate each skill with a comma</p>
                        {errors.skills && <p className="text-red-500 text-sm">{errors.skills.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Professional Bio</Label>
                        <Textarea
                            id="bio" 
                            placeholder="Tell us about your professional background..." 
                            className="h-32"
                            {...register("bio")}
                        />
                        {errors.bio && <p className="text-red-500 text-sm">{errors.bio.message}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={updateLoading}> 
                        {
                            updateLoading ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4 mr-2"/>
                                    Saving...
                                </>
                            ) : (
                                "Complete Profile"
                            )
                        }
                    </Button>
                </form>
            </CardContent>
            </Card>
        </div>
    )
}

export default OnboardingForm;;