
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import AnalysisResultCard from './components/AnalysisResultCard';
import LoginView from './components/LoginView';
import { auth } from './services/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ReportStep, ReportData, View, AnalysisResult, StrayDog, NewsItem, EventItem } from './types';
import { API_ENDPOINTS } from './config/api';

// Mock geolocation data for initial map state
const DEFAULT_CENTER: [number, number] = [20.4856, 79.3702];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('report');
  const [currentStep, setCurrentStep] = useState<ReportStep>('location');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Map State
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Detection State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reportData, setReportData] = useState<ReportData>({
    location: {
      address: "Melbourne, City of Melbourne, Victoria, Australia",
      lat: -37.8136,
      lng: 144.9631
    },
    media: [],
    description: "",
    action: 'report'
  });

  // News, Events, and Adoption Mock Data
  const news: NewsItem[] = [
    { id: '1', title: 'New Community Shelter Opens in North District', excerpt: 'A major milestone in our mission to provide safe havens for every stray dog.', date: 'Oct 28, 2023', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800' },
    { id: '2', title: 'Successful Vaccination Drive: 500+ Dogs Protected', excerpt: 'Our monthly rabies and distemper drive reached record numbers this week.', date: 'Oct 25, 2023', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800' },
    { id: '3', title: 'Local Heroes: The Chimur Rescue Team', excerpt: 'Spotlight on the volunteers making a difference in the rural outskirts.', date: 'Oct 20, 2023', image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800' },
  ];

  const events: EventItem[] = [
    { id: '1', title: 'Winter Paws Adoption Fair', date: 'Nov 12, 2023', location: 'City Park South', type: 'Adoption Drive' },
    { id: '2', title: 'Community Vet Day', date: 'Nov 15, 2023', location: 'StayCare HQ', type: 'Vaccination Camp' },
    { id: '3', title: 'Annual Charity Gala', date: 'Dec 05, 2023', location: 'Grand Plaza Hotel', type: 'Fundraiser' },
  ];

  const strays: StrayDog[] = [
    { id: '1', name: 'Buddy', location: 'Downtown Market', status: 'Ready for Adoption', description: 'A friendly golden retriever mix found wandering near the station.', imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=800' },
    { id: '2', name: 'Luna', location: 'East Side Park', status: 'In Temporary Care', description: 'Recovering from a minor leg injury. Very gentle and loves quiet spaces.', imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800' },
    { id: '3', name: 'Rocky', location: 'Industrial Zone', status: 'Newly Reported', description: 'Found recently. Needs medical checkup and a safe space to decompress.', imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800' },
  ];

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setReportData(prev => ({
          ...prev,
          location: {
            ...prev.location!,
            lat,
            lng,
            address: data.display_name
          }
        }));
      }
    } catch (error) {
      console.error("Reverse geocoding failed", error);
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        // Update map immediately
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          }
        }

        setReportData(prev => ({
          ...prev,
          location: {
            ...prev.location!,
            lat: latitude,
            lng: longitude,
            address: "Fetching address..."
          }
        }));

        await reverseGeocode(latitude, longitude);

      }, (error) => {
        console.error("Geolocation error", error);
        alert("Could not get your location. Please ensure location services are enabled.");
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleSearchLocation = async () => {
    const query = reportData.location?.address;
    if (!query) return;

    try {
      // Show loading state if needed, or just standard cursor
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);

        setReportData(prev => ({
          ...prev,
          location: {
            ...prev.location!,
            lat,
            lng,
            address: result.display_name
          }
        }));

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          }
        }
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (e) {
      console.error("Search failed", e);
      alert("Search failed. Please try again.");
    }
  };

  useEffect(() => {
    if (currentView === 'report' && currentStep === 'location') {
      // Initialize Leaflet Map
      if (!mapRef.current && mapContainerRef.current && (window as any).L) {
        const L = (window as any).L;
        const map = L.map(mapContainerRef.current).setView([reportData.location!.lat, reportData.location!.lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #C27856; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        markerRef.current = L.marker([reportData.location!.lat, reportData.location!.lng], { icon: customIcon, draggable: true }).addTo(map);

        markerRef.current.on('dragend', function (event: any) {
          const marker = event.target;
          const position = marker.getLatLng();
          reverseGeocode(position.lat, position.lng);
        });

        mapRef.current = map;
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [currentView, currentStep]);

  const handleStepNext = () => {
    if (currentStep === 'location') setCurrentStep('media');
    else if (currentStep === 'media') setCurrentStep('details');
    else if (currentStep === 'details') setCurrentStep('action');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepBack = () => {
    if (currentStep === 'media') setCurrentStep('location');
    else if (currentStep === 'details') setCurrentStep('media');
    else if (currentStep === 'action') setCurrentStep('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Result Ref for scrolling
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (detectionResult && !isAnalyzing && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [detectionResult, isAnalyzing]);

  const handlePredict = async (file: File) => {
    console.log("Starting prediction for file:", file.name);
    setIsAnalyzing(true);
    setDetectionResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log("Fetching prediction from backend...");
      const response = await fetch(API_ENDPOINTS.PREDICT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Prediction failed');
      }

      const data = await response.json();
      const result = data.prediction;
      console.log("Prediction received:", result);

      // Map prediction to AnalysisResult
      const diseaseInfo: Record<string, Partial<AnalysisResult>> = {
        "Dermatitis": {
          careAdvice: ["Keep the dog in a clean environment.", "Avoid allergens.", "Consult a vet for antihistamines."],
          riskLevel: 'MEDIUM'
        },
        "Fungal Infections": {
          careAdvice: ["Apply antifungal creams as prescribed.", "Keep the infected area dry.", "Wash bedding frequently."],
          riskLevel: 'MEDIUM'
        },
        "Healthy": {
          careAdvice: ["Maintain regular checkups.", "Ensure proper nutrition.", "Keep up with vaccinations."],
          riskLevel: 'CLEAR'
        },
        "Hypersensitivity": {
          careAdvice: ["Identify and remove triggers.", "Use hypoallergenic shampoos.", "Consult a vet for allergy testing."],
          riskLevel: 'LOW'
        },
        "Demodicosis": {
          careAdvice: ["Seek veterinary treatment for mites.", "Boost the dog's immune system.", "Regular cleaning of living spaces."],
          riskLevel: 'HIGH'
        },
        "Ringworm": {
          careAdvice: ["Isolate the dog from other pets and humans.", "Use prescribed antifungal medications.", "Disinfect all areas the dog visits."],
          riskLevel: 'HIGH'
        }
      };

      const info = diseaseInfo[result] || {
        careAdvice: ["Consult a veterinarian for a professional diagnosis and treatment plan."],
        riskLevel: 'MEDIUM'
      };

      // Create object URL for immediate preview (more reliable than FileReader for this flow)
      const imageUrl = URL.createObjectURL(file);

      setDetectionResult({
        imageUrl: imageUrl,
        matches: [
          { name: result, confidence: 95 }
        ],
        careAdvice: info.careAdvice as string[],
        riskLevel: info.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CLEAR'
      });

      console.log("Prediction flow complete.");

    } catch (error) {
      console.error("Prediction error:", error);
      alert(error instanceof Error ? error.message : "Failed to analyze image. Please ensure the backend server is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetScan = () => {
    setDetectionResult(null);
    setIsAnalyzing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Views rendering
  const renderHome = () => (
    <div className="space-y-16 animate-in fade-in duration-700">
      <section className="relative h-[550px] rounded-3xl lg:rounded-[3.5rem] overflow-hidden flex items-center px-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596797882943-19114002633d?auto=format&fit=crop&q=80&w=1600')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        <div className="relative max-w-2xl">
          <h1 className="text-5xl lg:text-7xl font-display font-bold mb-6 leading-tight">Empowering <span className="text-primary italic">Community</span> Rescue.</h1>
          <p className="text-xl text-slate-200 mb-10 max-w-lg leading-relaxed">Join thousands of volunteers reporting strays, providing care, and building a world where every pet has a home.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setCurrentView('report')} className="bg-primary hover:bg-opacity-90 px-10 py-5 rounded-2xl font-bold transition-all shadow-2xl shadow-primary/30 flex items-center gap-3 active:scale-95">
              <span className="material-symbols-outlined">add_location</span> Report a Stray
            </button>
            <button onClick={() => setCurrentView('adopt')} className="bg-white/10 hover:bg-white/20 backdrop-blur-xl px-10 py-5 rounded-2xl font-bold transition-all border border-white/20">
              Adopt a Friend
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
        {[
          { label: 'Animals Helped', val: '4.8k', icon: 'volunteer_activism' },
          { label: 'Open Reports', val: '124', icon: 'map' },
          { label: 'Success Stories', val: '912', icon: 'auto_awesome' },
          { label: 'Volunteers', val: '15k', icon: 'groups' }
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-surface-dark p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-display font-bold text-slate-800 dark:text-white">{stat.val}</h3>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Latest Stories */}
      <section>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-display font-bold mb-2">Community News</h2>
            <p className="text-slate-500">The latest impact reports and success stories</p>
          </div>
          <button className="text-primary font-bold flex items-center gap-1 group">
            All News <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map(item => (
            <div key={item.id} className="group cursor-pointer bg-white dark:bg-surface-dark rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-2">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
              </div>
              <div className="p-6">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">{item.date}</span>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2">{item.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderAdopt = () => (
    <div className="animate-in fade-in duration-700">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-display font-bold mb-3">Adoptable Strays</h1>
          <p className="text-slate-500 text-lg">Browse local strays currently looking for their forever homes.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-full border border-slate-200 text-sm font-bold bg-white">Filter</button>
          <button className="px-4 py-2 rounded-full border border-slate-200 text-sm font-bold bg-white">Sort</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {strays.map(dog => (
          <div key={dog.id} className="bg-white dark:bg-surface-dark rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group">
            <div className="aspect-[4/5] relative overflow-hidden">
              <img src={dog.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={dog.name} />
              <div className={`absolute top-4 right-4 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${dog.status === 'Ready for Adoption' ? 'bg-emerald-500/90 text-white' :
                dog.status === 'In Temporary Care' ? 'bg-amber-500/90 text-white' : 'bg-slate-900/80 text-white'
                }`}>
                {dog.status}
              </div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-display font-bold text-slate-800 dark:text-white">{dog.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-sm">location_on</span> {dog.location}</p>
                </div>
                <button className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 leading-relaxed line-clamp-3">{dog.description}</p>
              <button className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-primary transition-colors text-lg active:scale-95">
                Adopt {dog.name}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderInfo = () => (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700 space-y-20">
      <section className="text-center pt-10">
        <h1 className="text-6xl font-display font-bold mb-6">Our Mission</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">StayCare is more than just an app; it's a movement to digitize animal welfare and foster a community of proactive care.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="rounded-[3rem] overflow-hidden aspect-square shadow-2xl relative group">
          <img src="https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Our Mission" />
          <div className="absolute inset-0 bg-primary/20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div className="space-y-10">
          <div>
            <h2 className="text-4xl font-display font-bold mb-6">Who we are</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">Founded in 2021, StayCare started as a small local map to track street dogs. Today, we empower over 15,000 users across 40 cities to report distress and facilitate rescues.</p>
          </div>
          <div className="grid gap-6">
            {[
              { title: 'Community Driven', desc: '100% of our data comes from people like you.', icon: 'diversity_1' },
              { title: 'Technology First', desc: 'Using AI and GIS to optimize rescue routes.', icon: 'psychology' },
              { title: 'Ethical & Transparent', desc: 'Full accountability for every adoption.', icon: 'verified' }
            ].map((v, i) => (
              <div key={i} className="flex gap-5 p-6 rounded-3xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl">{v.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-1">{v.title}</h4>
                  <p className="text-sm text-slate-500 leading-snug">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportStep = () => {
    switch (currentStep) {
      case 'location':
        return (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-display font-bold mb-8">Select Location</h2>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search location..."
                  className="w-full h-16 pl-6 pr-14 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark focus:ring-primary focus:border-primary text-lg"
                  value={reportData.location?.address || ""}
                  onChange={(e) => setReportData({ ...reportData, location: { ...reportData.location!, address: e.target.value } })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                />
                <button
                  onClick={handleSearchLocation}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-slate-400">search</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCurrentLocation}
                  className="h-16 w-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95"
                  title="Use Current Location"
                >
                  <span className="material-symbols-outlined">my_location</span>
                </button>
                <button
                  onClick={handleSearchLocation}
                  className="h-16 w-16 bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-colors"
                  title="Search Location"
                >
                  <span className="material-symbols-outlined text-slate-500">near_me</span>
                </button>
              </div>
            </div>

            <div className="aspect-[21/9] w-full bg-slate-100 dark:bg-slate-900 rounded-3xl overflow-hidden relative border-2 border-slate-100 dark:border-slate-800 shadow-inner mb-8 z-10">
              <div ref={mapContainerRef} className="w-full h-full"></div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-8 rounded-3xl border border-amber-100 dark:border-amber-900/30 mb-10">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">Selected Location:</h4>
              <p className="text-lg text-slate-800 dark:text-slate-200 font-medium">{reportData.location?.address}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleStepNext}
                className="bg-primary text-white px-12 py-5 rounded-3xl font-bold flex items-center gap-3 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-lg"
              >
                Next Step <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        );

      case 'action':
        return (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-display font-bold mb-3">What will you do about this dog?</h2>
            <p className="text-slate-500 mb-12 text-lg">Your choice will determine the marker color on the community map</p>

            <div className="grid gap-6 mb-12">
              <label className={`p-8 rounded-3xl border-2 cursor-pointer flex items-center gap-8 transition-all group ${reportData.action === 'adopt' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`} onClick={() => setReportData({ ...reportData, action: 'adopt' })}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${reportData.action === 'adopt' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                  <span className="material-symbols-outlined text-3xl">home</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Permanently Adopt / Take Home</h3>
                  <p className="text-slate-500 text-sm">I will give this dog a permanent home</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Map marker:</span>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${reportData.action === 'adopt' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                  {reportData.action === 'adopt' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </label>

              <label className={`p-8 rounded-3xl border-2 cursor-pointer flex items-center gap-8 transition-all group ${reportData.action === 'care' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`} onClick={() => setReportData({ ...reportData, action: 'care' })}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${reportData.action === 'care' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                  <span className="material-symbols-outlined text-3xl">medical_services</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">Temporary Care / Contact Welfare</h3>
                  <p className="text-slate-500 text-sm">I will provide temporary care or help find rescue</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Map marker:</span>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${reportData.action === 'care' ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                  {reportData.action === 'care' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </label>

              <label className={`p-8 rounded-3xl border-2 cursor-pointer flex items-center gap-8 transition-all group ${reportData.action === 'report' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/10' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'}`} onClick={() => setReportData({ ...reportData, action: 'report' })}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${reportData.action === 'report' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                  <span className="material-symbols-outlined text-3xl">warning</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1 text-rose-600 dark:text-rose-400">Cannot Help Directly</h3>
                  <p className="text-slate-500 text-sm">Just reporting for awareness and help from others</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Map marker:</span>
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${reportData.action === 'report' ? 'border-rose-500 bg-rose-500' : 'border-slate-300'}`}>
                  {reportData.action === 'report' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </label>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleStepBack}
                className="px-10 py-5 rounded-3xl font-bold border-2 border-slate-100 dark:border-slate-800 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span> Back
              </button>
              <button
                onClick={() => { alert("Report submitted to community! Thank you for being a hero."); setCurrentView('home'); }}
                className="bg-primary text-white px-12 py-5 rounded-3xl font-bold shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-lg"
              >
                Submit Report
              </button>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-display font-bold mb-3">Upload Media</h2>
            <p className="text-slate-500 mb-10 text-lg">Clear photos of the stray help rescuers identify and locate the dog faster.</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 group cursor-pointer hover:border-primary/50 transition-all">
                <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">add_a_photo</span>
                <span className="text-xs font-bold uppercase">Add Photo</span>
              </div>
              <div className="aspect-square rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse"></div>
              <div className="aspect-square rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse"></div>
              <div className="aspect-square rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse"></div>
            </div>

            <div className="flex justify-between">
              <button onClick={handleStepBack} className="px-10 py-5 rounded-3xl font-bold border-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined">arrow_back</span> Back
              </button>
              <button onClick={handleStepNext} className="bg-primary text-white px-10 py-5 rounded-3xl font-bold flex items-center gap-2 shadow-2xl shadow-primary/30">
                Next Step <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        );

      case 'details':
        return (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-3xl font-display font-bold mb-3">Add Details</h2>
            <p className="text-slate-500 mb-10 text-lg">Help us understand the situation better.</p>

            <div className="space-y-6 mb-10">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Stray Description</label>
                <textarea
                  className="w-full h-40 p-6 rounded-3xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark focus:ring-primary focus:border-primary"
                  placeholder="Describe the dog (color, size, breed guess, temperament)..."
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Urgency Level</label>
                <div className="flex gap-4">
                  {['Normal', 'Urgent', 'Emergency'].map(lvl => (
                    <button key={lvl} className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${lvl === 'Normal' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}>{lvl}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={handleStepBack} className="px-10 py-5 rounded-3xl font-bold border-2 border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined">arrow_back</span> Back
              </button>
              <button onClick={handleStepNext} className="bg-primary text-white px-10 py-5 rounded-3xl font-bold flex items-center gap-2 shadow-2xl shadow-primary/30">
                Next Step <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        );
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home': return renderHome();
      case 'adopt': return renderAdopt();
      case 'info': return renderInfo();
      case 'disease': return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-display font-bold mb-6">AI Skin Analysis</h1>
            <p className="text-slate-500 text-lg">Use our advanced computer vision model to identify potential skin conditions in strays.</p>
          </div>
          <div className="bg-white dark:bg-surface-dark p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 mb-12">
            {!detectionResult ? (
              <div
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                className={`border-3 border-dashed border-slate-200 dark:border-slate-700 rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-all ${isAnalyzing ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className={`w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${isAnalyzing ? 'animate-spin' : ''}`}>
                  <span className="material-symbols-outlined text-primary text-5xl">
                    {isAnalyzing ? 'sync' : 'auto_fix_high'}
                  </span>
                </div>
                <h3 className="text-3xl font-bold mb-4">{isAnalyzing ? 'Analyzing Image...' : 'Drop Photo Here'}</h3>
                <p className="text-slate-500 max-w-sm mb-10 text-lg">Ensuring your images are sharp and well-lit will yield the most accurate results.</p>
                <button className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-12 py-5 rounded-2xl font-bold text-lg active:scale-95 transition-transform">
                  Browse Files
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handlePredict(e.target.files[0])} />
              </div>
            ) : (
              <div className="text-center p-10">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl">check_circle</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">Analysis Complete</h3>
                <p className="text-slate-500 mb-8">We've identified the potential condition. See the details below.</p>
                <button
                  onClick={handleResetScan}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  Scan Another Image
                </button>
              </div>
            )}
          </div>
          {detectionResult && !isAnalyzing && (
            <div ref={resultRef} className="mt-8">
              <AnalysisResultCard result={detectionResult} onReset={handleResetScan} />
            </div>
          )}
        </div>
      );
      case 'report': return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
          {/* Progress Stepper */}
          <div className="flex items-center justify-between px-10 mb-16 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0"></div>
            {[
              { key: 'location', icon: 'location_on', label: 'Location' },
              { key: 'media', icon: 'photo_camera', label: 'Media' },
              { key: 'details', icon: 'description', label: 'Details' },
              { key: 'action', icon: 'task_alt', label: 'Action' }
            ].map((s, i) => {
              const stepIdx = ['location', 'media', 'details', 'action'].indexOf(currentStep);
              const isActive = stepIdx >= i;
              const isExact = currentStep === s.key;

              return (
                <div key={s.key} className="flex flex-col items-center gap-3 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-110' : 'bg-white dark:bg-surface-dark border-2 border-slate-100 dark:border-slate-800 text-slate-300'}`}>
                    <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-slate-400'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-[3.5rem] p-12 lg:p-16 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/40">
            {renderReportStep()}
          </div>
        </div>
      );
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Loading StayCare...</p>
        </div>
      </div>
    );
  }

  // Mandatory Login
  if (!user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4">
        <LoginView onNavigate={setCurrentView} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary selection:text-white">
      <Header currentView={currentView} onNavigate={setCurrentView} user={user} />
      <main className="max-w-7xl mx-auto px-6 py-16 flex-1 w-full">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
