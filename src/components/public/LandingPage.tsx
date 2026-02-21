import React from 'react';
import {
  Navbar,
  Hero,
  Success,
  Centers,
  Process,
  Teacher,
  Discussion,
  Topstudent,
  Gallery,
  Channels,
  Contact,
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
      <Centers />
      <Teacher />
      <Topstudent />
      <Reviews />
      <Gallery />
      <Channels />
      <Footer />
    </>
  );
};

export default LandingPage;
