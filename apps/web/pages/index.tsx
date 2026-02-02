import { GetServerSideProps } from 'next';

const Home = () => null;

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: '/generate',
    permanent: false,
  },
});

export default Home;
