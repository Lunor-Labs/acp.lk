import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Navbar,
  Hero,
  Success,
  Centers,
  Teacher,
  Topstudent,
  Gallery,
  Channels,
  Footer,
  Reviews
} from '../features/landing/components';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const handleLoginRequest = () => navigate('/login');

  return (
    <>
      <Navbar onLoginRequest={handleLoginRequest} />
      <Hero onLoginRequest={handleLoginRequest} />
      <Success />
      <Teacher />
      <Centers />
      <Reviews />
      <Gallery />
      <Topstudent />
      <Channels />
      <Footer />
    </>
  );
};

export default LandingPage;
