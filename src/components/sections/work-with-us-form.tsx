'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, ChevronDown, Check, Sparkles, Users, Code, Bot, HelpCircle } from 'lucide-react';

const SERVICE_OPTIONS = [
  {
    id: 'Technology Talent & Staff Augmentation',
    label: 'Technology Talent & Dedicated Engineers',
    description: 'Pre-vetted software engineers, architects & tech leads',
    icon: Users,
  },
  {
    id: 'Custom Software & Enterprise Solutions',
    label: 'Custom Software & Web/Mobile Solutions',
    description: 'End-to-end bespoke platforms, web apps & mobile systems',
    icon: Code,
  },
  {
    id: 'AI Integration & Data Engineering',
    label: 'AI Integration & Intelligent Systems',
    description: 'LLM agents, automated workflows & data pipelines',
    icon: Bot,
  },
  {
    id: 'General Enterprise Consultation',
    label: 'General Enterprise Consultation',
    description: 'Technical advisory, system audit & digital roadmap',
    icon: HelpCircle,
  },
];

export default function WorkWithUsForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    subject: '',
    message: ''
  });

  // Pre-fill email from query parameters (e.g. from homepage hero section)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setFormData(prev => ({
        ...prev,
        workEmail: emailParam
      }));
    }
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      subject: serviceId
    }));
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject) {
      setSubmitStatus('error');
      setErrorMessage('Please select a service of interest from the dropdown.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/work-with-us', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitStatus('success');
      setFormData({
        fullName: '',
        workEmail: '',
        subject: '',
        message: ''
      });
      
      // Reset success message after 6 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 6000);
      
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption = SERVICE_OPTIONS.find(opt => opt.id === formData.subject);

  return (
    <div className="bg-white rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.04)] p-8 sm:p-10 md:p-12 border border-gray-200/80 font-text relative">
      <AnimatePresence mode="wait">
        {submitStatus === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 bg-[#f5f5f7] border border-gray-200 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8 text-[#0071e3]" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] mb-3">Message Received</h3>
            <p className="text-[#6e6e73] max-w-md mx-auto text-[16px] leading-relaxed">
              Thank you for getting in touch. Our team at Dort Asia will review your requirements and respond within 24 hours.
            </p>
            <button
              onClick={() => setSubmitStatus('idle')}
              className="mt-8 px-6 py-2.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-sm font-semibold rounded-full transition-colors border border-gray-200"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {submitStatus === 'error' && (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl flex items-start gap-3 border border-red-200/80">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left Column: Inputs */}
              <div className="space-y-4 sm:space-y-5 flex flex-col justify-between">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0071e3] focus:bg-white text-[#1d1d1f] placeholder:text-[#86868b] rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-[#0071e3]/10 transition-all text-[15px]"
                  />
                </div>
                
                <div>
                  <label htmlFor="workEmail" className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                    Work Email
                  </label>
                  <input
                    type="email"
                    id="workEmail"
                    name="workEmail"
                    required
                    value={formData.workEmail}
                    onChange={handleChange}
                    placeholder="jane@company.com"
                    className="w-full bg-[#f5f5f7] border border-transparent focus:border-[#0071e3] focus:bg-white text-[#1d1d1f] placeholder:text-[#86868b] rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-[#0071e3]/10 transition-all text-[15px]"
                  />
                </div>
                
                {/* Custom Interactive Dropdown UI */}
                <div ref={dropdownRef} className="relative">
                  <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                    Service of Interest
                  </label>
                  
                  {/* Dropdown Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className={`w-full bg-[#f5f5f7] border transition-all text-[15px] rounded-2xl px-5 py-3.5 outline-none flex items-center justify-between text-left ${
                      isDropdownOpen 
                        ? 'border-[#0071e3] bg-white ring-4 ring-[#0071e3]/10' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <span className={selectedOption ? 'text-[#1d1d1f] font-medium truncate' : 'text-[#86868b]'}>
                      {selectedOption ? selectedOption.label : 'Select an area of interest'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#86868b] transition-transform duration-200 flex-shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180 text-[#0071e3]' : ''}`} />
                  </button>

                  {/* Dropdown Menu Popover */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-gray-200 shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-2 z-50 overflow-hidden"
                      >
                        <div className="space-y-1">
                          {SERVICE_OPTIONS.map((option) => {
                            const isSelected = formData.subject === option.id;
                            const IconComponent = option.icon;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelectService(option.id)}
                                className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-start justify-between gap-3 group ${
                                  isSelected 
                                    ? 'bg-[#f5f5f7] text-[#1d1d1f]' 
                                    : 'hover:bg-[#f5f5f7]/70 text-[#1d1d1f]'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                    isSelected 
                                      ? 'bg-[#1d1d1f] text-white' 
                                      : 'bg-[#f5f5f7] text-[#1d1d1f] group-hover:bg-white border border-gray-200/50'
                                  }`}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className={`text-[14px] leading-tight ${isSelected ? 'font-semibold text-[#1d1d1f]' : 'font-medium text-[#1d1d1f]'}`}>
                                      {option.label}
                                    </p>
                                    <p className="text-xs text-[#86868b] mt-1 leading-snug">
                                      {option.description}
                                    </p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#0071e3] flex-shrink-0 mt-1" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Column: Textarea */}
              <div className="flex flex-col h-full">
                <label htmlFor="message" className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                  Project Details or Requirements
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us about your project scope, required skill sets, or timeline..."
                  className="w-full flex-grow min-h-[160px] lg:min-h-[190px] bg-[#f5f5f7] border border-transparent focus:border-[#0071e3] focus:bg-white text-[#1d1d1f] placeholder:text-[#86868b] rounded-2xl px-5 py-3.5 outline-none focus:ring-4 focus:ring-[#0071e3]/10 transition-all resize-none text-[15px]"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1d1d1f] hover:bg-black text-white font-semibold text-[16px] py-4 px-8 rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.18)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <span>Send Message</span>
                    <ArrowRight className="w-4 h-4 text-white/80" />
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
