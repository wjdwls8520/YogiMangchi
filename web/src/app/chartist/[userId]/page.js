import MainLayout from '../../../shared/layout/MainLayout';
import ChartistProfile from '@/features/chartist/ui/ChartistProfile';

export default async function ChartistProfilePage({ params }) {
    const { userId } = await params;
    return (
        <MainLayout>
            <ChartistProfile userId={userId} />
        </MainLayout>
    );
}
