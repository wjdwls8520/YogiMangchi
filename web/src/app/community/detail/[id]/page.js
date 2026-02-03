import MainLayout from '../../../../shared/layout/MainLayout';
import CommunityDetail from '../../../../features/community/ui/CommunityDetail';

export default async function CommunityDetailPage({ params }) {
    const { id } = await params;
    return (
        <MainLayout>
            <CommunityDetail id={id} />
        </MainLayout>
    );
}
