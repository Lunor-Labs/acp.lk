import React from 'react';
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
} from '../landing';

interface LandingPageProps {
  onLoginRequest?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginRequest }) => {
  return (
    <>
      <Navbar onLoginRequest={onLoginRequest} />
      <Hero onLoginRequest={onLoginRequest} />
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
