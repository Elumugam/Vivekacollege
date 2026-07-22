import React from "react";

export const metadata = {
  title: "Privacy Policy | Viveka College",
  description: "Privacy Policy for Viveka College distance learning programs.",
};

export default function PrivacyPage() {
  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-6 max-w-4xl space-y-6">
        <h1 className="text-4xl font-serif font-bold text-navy">Privacy Policy</h1>
        <p className="text-gray-text leading-relaxed">
          At Viveka College, we are committed to protecting your personal information and respecting your privacy.
        </p>
        <h2 className="text-2xl font-serif font-bold text-navy pt-4">Information We Collect</h2>
        <p className="text-gray-text leading-relaxed">
          We collect information you provide directly when filling out application forms, enquiry forms, or contacting our student support team.
        </p>
        <h2 className="text-2xl font-serif font-bold text-navy pt-4">How We Use Your Information</h2>
        <p className="text-gray-text leading-relaxed">
          Your details are used solely for academic counseling, course processing, student support services, and institutional announcements.
        </p>
      </div>
    </div>
  );
}
