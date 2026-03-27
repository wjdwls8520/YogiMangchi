import SubMenu from "@/components/SubMenu";
const menus  = [
    { id: "best", label: "주간 인기글" },
    { id: "latest", label: "최신글" },
];

export default async function CommunityPage() {
    
    return (
        <>
            <SubMenu menus={menus} />        
        </>
    )
}