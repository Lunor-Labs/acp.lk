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
      <Process />
      <Teacher />
      <Discussion />
      <Topstudent />
      <Gallery />
      <Channels />
      <Contact />
      <Footer />
    </>
  );
};

export default LandingPage;
