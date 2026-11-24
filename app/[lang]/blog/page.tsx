import BlogList from "@/components/BlogList";import {Lang} from "@/lib/content";
export default async function Blog({params}:{params:Promise<{lang:Lang}>}){const {lang}=await params;return <BlogList lang={lang}/>}
