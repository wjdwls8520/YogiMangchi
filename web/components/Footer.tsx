import Link from "next/link";

export default function Footer() {
    return <footer className="border-t-1 border-gray-300 text-gray-500 text-center py-8">
        <nav aria-label="Footer">
        <ul className="flex justify-center gap-6">
            <li><Link href="#">이용약관</Link></li>
            <li><Link href="#">개인정보처리방침</Link></li>
            <li><Link href="#">고객센터</Link></li>
        </ul>
        </nav>
        <small className="block pt-5">© 2026 Yogi-Mangchi. All rights reserved.</small>
    </footer>
}