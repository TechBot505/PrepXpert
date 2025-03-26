"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Save, AlertTriangle, Monitor, Edit, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resumeSchema } from "@/app/lib/schema";
import useFetch from "@/hooks/use-fetch";
import { saveResume } from "@/actions/resume";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import EntryForm from "./entry-form";
import { toast } from "sonner";
import MDEditor from "@uiw/react-md-editor";
import { useUser } from "@clerk/nextjs";
import { entriesToMarkdown } from "@/app/lib/helper";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ResumeBuilder = ({ initialContent }) => {

    const [activeTab, setActiveTab] = useState("edit");
    const [previewContent, setPreviewContent] = useState(initialContent);
    const { user } = useUser();
    const [resumeMode, setResumeMode] = useState("preview");

    const {control, register, handleSubmit, watch, formState: { errors }} = useForm({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            contactInfo: {},
            summary: "",
            skills: "",
            experience: [],
            education: [],
            projects: [],
        }
    })

    const {
        loading: isSaving,
        func: saveResumeFunc,
        data: saveResult,
        error: saveError,
    } = useFetch(saveResume);

    const formValues = watch();

    useEffect(() => {
        if(initialContent) setActiveTab("preview");
    }, [initialContent]);

    useEffect(() => {
        if (activeTab === "edit") {
          const newContent = getCombinedContent();
          setPreviewContent(newContent ? newContent : initialContent);
        }
    }, [formValues, activeTab]);

    useEffect(() => {
        if (saveResult && !isSaving) {
          toast.success("Resume saved successfully!");
        }
        if (saveError) {
          toast.error(saveError.message || "Failed to save resume");
        }
    }, [saveResult, saveError, isSaving]);

    const getContactMarkdown = () => {
        const { contactInfo } = formValues;
        const parts = [];
        if (contactInfo.email) parts.push(`📧 ${contactInfo.email}`);
        if (contactInfo.mobile) parts.push(`📱 ${contactInfo.mobile}`);
        if (contactInfo.linkedin)
          parts.push(`💼 [LinkedIn](${contactInfo.linkedin})`);
        if (contactInfo.twitter) parts.push(`🐦 [Twitter](${contactInfo.twitter})`);
    
        return parts.length > 0
          ? `## <div align="center">${user.fullName}</div>
            \n\n<div align="center">\n\n${parts.join(" | ")}\n\n</div>`
          : "";
    };

    const getCombinedContent = () => {
        const { summary, skills, experience, education, projects } = formValues;
        return [
          getContactMarkdown(),
          summary && `## Professional Summary\n\n${summary}`,
          skills && `## Skills\n\n${skills}`,
          entriesToMarkdown(experience, "Work Experience"),
          entriesToMarkdown(education, "Education"),
          entriesToMarkdown(projects, "Projects"),
        ]
          .filter(Boolean)
          .join("\n\n");
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const resumeRef = useRef();

    const generatePDFFunc = async () => {
        setIsGenerating(true);
        try {
            const element = resumeRef.current;
            if (!element) throw new Error("Resume element not found");
    
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
            });
    
            const imgData = canvas.toDataURL("image/jpeg");
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
    
            // Create a new PDF document (A4 size: 210mm x 297mm)
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4",
            });
    
            const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

            const pageHeight = pdfHeight * (imgWidth / pdfWidth);
    
            // Add pages by slicing the image
            let y = 0;
            while (y < imgHeight) {
                const sliceHeight = Math.min(pageHeight, imgHeight - y);
                pdf.addImage(
                    imgData,
                    "PNG",
                    0, // x position on PDF
                    0, // y position on PDF
                    pdfWidth, // width on PDF
                    (sliceHeight * pdfWidth) / imgWidth, // height on PDF, scaled
                    null, // alias
                    "FAST", // compression
                    0, // rotation
                    0, // source x (sx)
                    y, // source y (sy)
                    imgWidth, // source width (sWidth)
                    sliceHeight // source height (sHeight)
                );
                y += pageHeight;
                if (y < imgHeight) {
                    pdf.addPage();
                }
            }
    
            pdf.save("resume.pdf");
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            const formattedContent = previewContent
                .replace(/\n/g, "\n") // Normalize newlines
                .replace(/\n\s*\n/g, "\n\n") // Normalize multiple newlines to double newlines
                .trim();
        
            console.log(previewContent, formattedContent);
            await saveResumeFunc(previewContent);
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    return (
        <div data-color-mode="light" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <h1 className="md:text-6xl text-5xl gradient-title font-bold">
                    Resume Builder
                </h1>
                <div className="space-x-2">
                    <Button variant="destructive" onClick={handleSubmit(onSubmit)} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                            ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save
                            </>
                        )}
                    </Button>
                    <Button onClick={generatePDFFunc} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating PDF...
                            </>
                            ) : (
                            <>
                                <Download className="h-4 w-4" />
                                Download PDF
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="edit">Form</TabsTrigger>
                    <TabsTrigger value="preview">Markdown</TabsTrigger>
                </TabsList>

                <TabsContent value="edit">
                    <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        {...register("contactInfo.email")}
                                        type="email"
                                        placeholder="your@email.com"
                                        error={errors.contactInfo?.email}
                                    />
                                    {errors.contactInfo?.email && (
                                        <p className="text-sm text-red-500">
                                            {errors.contactInfo.email.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mobile Number</label>
                                    <Input
                                        {...register("contactInfo.mobile")}
                                        type="tel"
                                        placeholder="+91 1234 567 890"
                                    />
                                    {errors.contactInfo?.mobile && (
                                        <p className="text-sm text-red-500">
                                            {errors.contactInfo.mobile.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">LinkedIn URL</label>
                                    <Input
                                        {...register("contactInfo.linkedin")}
                                        type="url"
                                        placeholder="https://linkedin.com/in/your-profile"
                                    />
                                    {errors.contactInfo?.linkedin && (
                                        <p className="text-sm text-red-500">
                                            {errors.contactInfo.linkedin.message}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                        Twitter/X Profile
                                    </label>
                                    <Input
                                        {...register("contactInfo.twitter")}
                                        type="url"
                                        placeholder="https://twitter.com/your-handle"
                                    />
                                    {errors.contactInfo?.twitter && (
                                        <p className="text-sm text-red-500">
                                            {errors.contactInfo.twitter.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Professional Summary</h3>
                            <Controller
                                name="summary"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        className="h-32"
                                        placeholder="Write a compelling professional summary..."
                                        error={errors.summary}
                                    />
                                )}
                            />
                            {errors.summary && (
                                <p className="text-sm text-red-500">{errors.summary.message}</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Skills</h3>
                            <Controller
                                name="skills"
                                control={control}
                                render={({ field }) => (
                                    <Textarea
                                        {...field}
                                        className="h-32"
                                        placeholder="List your key skills..."
                                        error={errors.skills}
                                    />
                                )}
                            />
                            {errors.skills && (
                                <p className="text-sm text-red-500">{errors.skills.message}</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Work Experience</h3>
                            <Controller
                                name="experience"
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type="Experience"
                                        entries={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.experience && (
                                <p className="text-sm text-red-500">
                                    {errors.experience.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Education</h3>
                            <Controller
                                name="education"
                                control={control}
                                render={({ field }) => (
                                <EntryForm
                                    type="Education"
                                    entries={field.value}
                                    onChange={field.onChange}
                                />
                                )}
                            />
                            {errors.education && (
                                <p className="text-sm text-red-500">
                                    {errors.education.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Projects</h3>
                            <Controller
                                name="projects"
                                control={control}
                                render={({ field }) => (
                                <EntryForm
                                    type="Project"
                                    entries={field.value}
                                    onChange={field.onChange}
                                />
                                )}
                            />
                            {errors.projects && (
                                <p className="text-sm text-red-500">
                                    {errors.projects.message}
                                </p>
                            )}
                        </div>
                    </form>
                </TabsContent>

                <TabsContent value="preview">
                    {activeTab === "preview" && (
                        <Button
                            variant="link"
                            type="button"
                            className="mb-2"
                            onClick={() =>
                                setResumeMode(resumeMode === "preview" ? "edit" : "preview")
                            }
                        >
                            {resumeMode === "preview" ? (
                                <>
                                    <Edit className="h-4 w-4" />
                                    Edit Resume
                                </>
                            ) : (
                                <>
                                    <Monitor className="h-4 w-4" />
                                    Show Preview
                                </>
                            )}
                        </Button>
                    )}

                    {activeTab === "preview" && resumeMode !== "preview" && (
                        <div className="flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="text-sm">
                                You will lose editied markdown if you update the form data.
                            </span>
                        </div>
                    )}
                    <div className="border rounded-lg">
                        <MDEditor
                            value={previewContent}
                            onChange={setPreviewContent}
                            height={800}
                            preview={resumeMode}
                        />
                    </div>
                    <div style={{ position: "absolute", left: "-9999px" }}>
                        <div 
                            ref={resumeRef} 
                            style={{
                                width: "210mm",
                                padding: "10mm",
                                background: "white",
                                color: "black",
                            }}
                        >
                            <MDEditor.Markdown
                                source={previewContent}
                                style={{
                                    background: "white",
                                    color: "black",
                                }}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ResumeBuilder;