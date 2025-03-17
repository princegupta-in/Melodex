
import { Navbar } from "@/components/Navbar";

export default function PageLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
