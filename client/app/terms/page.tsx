import React from "react";

export const metadata = {
  title: "Terms of Use | Viveka College",
  description: "Terms of Use for Viveka College distance learning programs.",
};

export default function TermsPage() {
  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-4xl space-y-6">
        <h1 className="text-4xl font-serif font-bold text-navy">Terms of Use</h1>
        <p className="text-gray-text leading-relaxed">
          Welcome to Viveka College. By accessing or using our website and services, you agree to comply with and be bound by these terms.
        </p>
        <h2 className="text-2xl font-serif font-bold text-navy pt-4">Academic & Admission Guidelines</h2>
        <p className="text-gray-text leading-relaxed">
          All course enrollments, eligibility criteria, and fee structures are subject to official university regulations and UGC-DEB guidelines.
        </p>
        <h2 className="text-2xl font-serif font-bold text-navy pt-4">Use of Website Content</h2>
        <p className="text-gray-text leading-relaxed">
          Content, materials, and logos provided on this website are owned by Viveka College and may not be reproduced without prior written permission.
        </p>
      </div>
    </div>
  );
}
