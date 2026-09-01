import { useEffect, useRef, useState } from "react"
import {
  ArrowRight, BarChart3, Brain, Check, ChevronDown, Eye, EyeOff, Globe2,
  LockKeyhole, Menu, ShieldCheck, Sparkles, Target, TrendingUp, WalletCards, X,
} from "lucide-react"
import { SidebarLogo } from "./MoneyMindLogo"

const COPY = {
  en: {
    nav: { features: "Features", how: "How It Works", ai: "AI Guidance", security: "Security", resources: "Resources", login: "Login", create: "Create Account" },
    hero: {
      badge: "INTELLIGENT PERSONAL FINANCE",
      titleLine1: "Master Your Money.",
      titleLine2: "Shape Your Future.",
      description: "Plan, track, and grow your finances from one private command center built for clarity, discipline, and lasting wealth.",
      ctaPrimary: "Start Building Wealth",
      ctaSecondary: "Explore the Platform",
      trust: "Private by design", trustB: "Secure by default", trustC: "Built around you",
    },
    valueStrip: ["Your complete financial picture", "SRD and multi-currency support", "AI-powered financial guidance", "Privacy-focused design"],
    features: {
      eyebrow: "One connected platform",
      title: "Everything you need to build financial clarity.",
      description: "Purpose-built modules work together without turning your financial life into a maze of disconnected tools.",
      groups: [
        ["Control Your Money", "Organize transactions, budgets, bills, categories and cash flow in one disciplined workspace.", ["Transactions", "Smart budgeting", "Bills and cash flow"]],
        ["Build Your Wealth", "Track net worth, savings, goals, emergency funds and investments with a clear long-term view.", ["Net worth", "Goals and savings", "Investments"]],
        ["Reduce Financial Pressure", "Understand debt, plan repayments and see upcoming financial pressure before it arrives.", ["Debt Manager", "Payment planning", "Cash-flow forecasting"]],
        ["Make Better Decisions", "Use financial-health measures, reports, currency tools and educational AI guidance to understand next steps.", ["AI Assistant", "Financial Health", "Reports and currency"]],
      ],
    },
    how: {
      eyebrow: "How it works",
      title: "From information to measurable progress.",
      steps: [
        ["01", "Add your financial information", "Add accounts, income, expenses, transactions, debts and investments in one secure place."],
        ["02", "Understand your financial position", "Money Mind organizes your information into budgets, cash flow, net worth and financial-health insights."],
        ["03", "Follow your financial plan", "Use goals, reminders, forecasts and intelligent guidance to make measurable progress."],
      ],
    },
    ai: {
      title: "Financial intelligence that understands your goals.",
      description: "Ask questions, understand your spending and turn your financial information into practical next steps.",
      prompts: ["Where did I overspend this month?", "Can I afford this purchase?", "How can I reach my emergency-fund goal faster?", "Create a debt-repayment plan.", "Summarize my financial progress this week."],
      demoQuestion: "Where did I overspend this month?",
      demoAnswer: "Your demo spending shows dining and subscriptions above their planned ranges. Review those categories first and compare them with your monthly goals.",
      demoLabel: "Demo conversation • No real user data",
      disclaimer: "Money Mind provides educational financial guidance and does not replace professional financial, tax or legal advice.",
    },
    security: {
      eyebrow: "Privacy and security",
      title: "Your financial data deserves serious protection.",
      description: "Clear controls and established authentication tools help you manage access and retain control of your information.",
      items: [
        ["Secure authentication", "Sign in through the existing Firebase authentication flow."],
        ["Privacy controls", "Configure local app-lock and notification preferences."],
        ["Data export", "Export supported financial datasets from Export Center."],
        ["Session choices", "Choose persistent or session-only sign-in on this device."],
      ],
    },
    ecosystem: {
      eyebrow: "Money Mind ecosystem",
      title: "One financial system. Every decision connected.",
      label: "Financial Command Center",
      items: ["Budget & Bills", "Cash Flow", "Net Worth", "Goals & Savings", "Debt Manager", "Investments", "Financial Health", "AI Assistant", "Reports", "Currency Center"],
    },
    conversion: {
      title: "Take control of your financial future.",
      description: "Build clarity, discipline and lasting wealth with one intelligent financial command center.",
      ctaPrimary: "Create Account",
      ctaSecondary: "Explore Features",
    },
    faq: {
      eyebrow: "FAQ",
      title: "Questions, answered clearly.",
      items: [
        ["What is Money Mind?", "Money Mind is a personal-finance workspace for organizing budgets, transactions, goals, debt, investments and financial insights."],
        ["Is Money Mind a bank?", "No. Money Mind is a financial planning and education platform, not a bank or financial institution."],
        ["Does Money Mind support SRD?", "Yes. SRD is supported as a base and transaction currency."],
        ["Can I use multiple currencies?", "Yes. Money Mind supports multiple currencies using the platform's existing conversion tools."],
        ["How does the AI Financial Assistant use my information?", "It uses the financial context available inside your Money Mind account to explain patterns and provide educational guidance."],
        ["Can I export my financial data?", "Yes. Existing datasets can be exported from Export Center."],
        ["Does Money Mind work on mobile?", "Yes. The responsive interface supports phones, tablets and desktop browsers."],
        ["Can I install Money Mind as an app?", "Yes. Supported browsers can install Money Mind as a progressive web app."],
        ["How is my information protected?", "Money Mind uses Firebase authentication and provides privacy, app-lock and export controls. No system can guarantee absolute security."],
        ["Can I switch between light and dark themes?", "Yes. Choose Light, Dark or System and the preference is remembered."],
      ],
    },
    footer: {
      tagline: "Intelligent personal finance for clarity, discipline and lasting wealth.",
      product: "Product", productLinks: ["Features", "AI Assistant", "Security"],
      resources: "Resources", resourcesLinks: ["How It Works", "FAQ"],
      account: "Account",
    },
    auth: {
      backToHome: "Back to Home",
      brandTitle: "Your financial command center is ready.",
      brandDescription: "Continue building clarity, discipline and lasting wealth.",
      brandPrivacy: "Your privacy controls, session choices and financial exports remain in your hands.",
      formTitle: { login: "Welcome back", register: "Create your account", reset: "Reset your password" },
      formSubtitle: {
        login: "Sign in to continue to your Money Mind financial command center.",
        register: "Start building your private financial command center.",
        reset: "Enter your email and we'll send password-reset instructions.",
      },
      fields: {
        fullName: "Full name", email: "Email address", password: "Password", confirmPassword: "Confirm password",
        passwordHelp: "Use at least 6 characters. Choose a unique password you do not use elsewhere.",
        rememberMe: "Remember me", forgotPassword: "Forgot password?",
      },
      submit: { wait: "Please wait…", reset: "Send Reset Link", register: "Create Account", login: "Sign In" },
      backToSignIn: "Back to Sign In",
      orDivider: "or",
      google: "Continue with Google",
      switchToRegister: "Don't have an account? Create Account",
      switchToLogin: "Already have an account? Sign In",
      legal: { privacy: "Privacy Policy", terms: "Terms of Service", help: "Help" },
    },
    demo: {
      title: "Financial Command Center", subtitle: "Demo overview", status: "Private workspace",
      netWorth: "Net Worth", monthlyIncome: "Monthly Income", totalSavings: "Total Savings", healthScore: "Health Score",
      cashFlow: "Cash flow", last6Months: "Last 6 months", monthlyBudget: "Monthly budget",
      needs: "Needs", goals: "Goals", savings: "Savings",
      savingsGoals: "Savings goals", emergencyFund: "Emergency fund", homeDeposit: "Home deposit",
      recentTransactions: "Recent transactions", salary: "Salary", utilities: "Utilities",
      aiInsight: "AI insight", aiInsightText: "Your savings rate is moving in the right direction.",
    },
  },
  nl: {
    nav: { features: "Functies", how: "Hoe het werkt", ai: "AI-begeleiding", security: "Beveiliging", resources: "Bronnen", login: "Inloggen", create: "Account maken" },
    hero: {
      badge: "INTELLIGENTE PERSOONLIJKE FINANCIËN",
      titleLine1: "Beheers Je Geld.",
      titleLine2: "Bouw Je Toekomst.",
      description: "Plan, volg en laat je financiën groeien vanuit één privé commandocentrum, gebouwd voor overzicht, discipline en blijvende welvaart.",
      ctaPrimary: "Begin Met Vermogen Opbouwen",
      ctaSecondary: "Ontdek Het Platform",
      trust: "Privé by design", trustB: "Standaard veilig", trustC: "Gebouwd om jou",
    },
    valueStrip: ["Je volledige financiële overzicht", "Ondersteuning voor SRD en meerdere valuta", "AI-gestuurde financiële begeleiding", "Privacygericht ontwerp"],
    features: {
      eyebrow: "Eén verbonden platform",
      title: "Alles wat je nodig hebt voor financieel overzicht.",
      description: "Speciaal gebouwde modules werken samen, zonder dat je financiële leven een doolhof van losse tools wordt.",
      groups: [
        ["Beheers Je Geld", "Organiseer transacties, budgetten, rekeningen, categorieën en cashflow op één overzichtelijke plek.", ["Transacties", "Slim budgetteren", "Rekeningen en cashflow"]],
        ["Bouw Je Vermogen", "Volg je netto vermogen, spaargeld, doelen, noodfonds en investeringen met een helder langetermijnoverzicht.", ["Netto vermogen", "Doelen en sparen", "Investeringen"]],
        ["Verminder Financiële Druk", "Begrijp je schulden, plan aflossingen en zie financiële druk aankomen voordat die er is.", ["Schuldenbeheer", "Betalingsplanning", "Cashflow-prognose"]],
        ["Neem Betere Beslissingen", "Gebruik financiële-gezondheidsmetingen, rapporten, valutatools en educatieve AI-begeleiding om je volgende stappen te begrijpen.", ["AI-assistent", "Financiële gezondheid", "Rapporten en valuta"]],
      ],
    },
    how: {
      eyebrow: "Hoe het werkt",
      title: "Van informatie naar meetbare vooruitgang.",
      steps: [
        ["01", "Voeg je financiële informatie toe", "Voeg rekeningen, inkomsten, uitgaven, transacties, schulden en investeringen toe op één beveiligde plek."],
        ["02", "Begrijp je financiële positie", "Money Mind organiseert je informatie in budgetten, cashflow, netto vermogen en financiële-gezondheidsinzichten."],
        ["03", "Volg je financiële plan", "Gebruik doelen, herinneringen, prognoses en intelligente begeleiding om meetbare vooruitgang te boeken."],
      ],
    },
    ai: {
      title: "Financiële intelligentie die je doelen begrijpt.",
      description: "Stel vragen, begrijp je uitgaven en zet je financiële informatie om in praktische volgende stappen.",
      prompts: ["Waar heb ik deze maand te veel uitgegeven?", "Kan ik me deze aankoop veroorloven?", "Hoe bereik ik mijn noodfondsdoel sneller?", "Maak een schuldaflossingsplan.", "Vat mijn financiële vooruitgang deze week samen."],
      demoQuestion: "Waar heb ik deze maand te veel uitgegeven?",
      demoAnswer: "Je demo-uitgaven laten zien dat uit eten gaan en abonnementen boven hun geplande bereik liggen. Bekijk deze categorieën eerst en vergelijk ze met je maandelijkse doelen.",
      demoLabel: "Demogesprek • Geen echte gebruikersgegevens",
      disclaimer: "Money Mind biedt educatieve financiële begeleiding en vervangt geen professioneel financieel, fiscaal of juridisch advies.",
    },
    security: {
      eyebrow: "Privacy en beveiliging",
      title: "Je financiële gegevens verdienen serieuze bescherming.",
      description: "Duidelijke controles en beproefde authenticatietools helpen je toegang te beheren en controle over je informatie te houden.",
      items: [
        ["Veilige authenticatie", "Log in via de bestaande Firebase-authenticatie."],
        ["Privacycontroles", "Configureer lokale app-vergrendeling en meldingsvoorkeuren."],
        ["Gegevens exporteren", "Exporteer ondersteunde financiële datasets vanuit het Exportcentrum."],
        ["Sessiekeuzes", "Kies voor permanent of alleen-sessie inloggen op dit apparaat."],
      ],
    },
    ecosystem: {
      eyebrow: "Money Mind-ecosysteem",
      title: "Eén financieel systeem. Elke beslissing verbonden.",
      label: "Financieel Commandocentrum",
      items: ["Budget & Rekeningen", "Cashflow", "Netto Vermogen", "Doelen & Sparen", "Schuldenbeheer", "Investeringen", "Financiële Gezondheid", "AI-assistent", "Rapporten", "Valutacentrum"],
    },
    conversion: {
      title: "Neem controle over je financiële toekomst.",
      description: "Bouw overzicht, discipline en blijvende welvaart op met één intelligent financieel commandocentrum.",
      ctaPrimary: "Account Maken",
      ctaSecondary: "Ontdek Functies",
    },
    faq: {
      eyebrow: "Veelgestelde vragen",
      title: "Vragen, duidelijk beantwoord.",
      items: [
        ["Wat is Money Mind?", "Money Mind is een persoonlijke financiële werkruimte voor het organiseren van budgetten, transacties, doelen, schulden, investeringen en financiële inzichten."],
        ["Is Money Mind een bank?", "Nee. Money Mind is een platform voor financiële planning en educatie, geen bank of financiële instelling."],
        ["Ondersteunt Money Mind SRD?", "Ja. SRD wordt ondersteund als basis- en transactievaluta."],
        ["Kan ik meerdere valuta gebruiken?", "Ja. Money Mind ondersteunt meerdere valuta via de bestaande conversietools van het platform."],
        ["Hoe gebruikt de AI Financial Assistant mijn gegevens?", "De assistent gebruikt de financiële context binnen jouw Money Mind-account om patronen uit te leggen en educatieve begeleiding te bieden."],
        ["Kan ik mijn financiële gegevens exporteren?", "Ja. Bestaande datasets kunnen worden geëxporteerd vanuit het Exportcentrum."],
        ["Werkt Money Mind op mobiel?", "Ja. De responsieve interface ondersteunt telefoons, tablets en desktopbrowsers."],
        ["Kan ik Money Mind als app installeren?", "Ja. Ondersteunde browsers kunnen Money Mind als progressive web app installeren."],
        ["Hoe worden mijn gegevens beschermd?", "Money Mind gebruikt Firebase-authenticatie en biedt privacy-, app-vergrendelings- en exportcontroles. Geen enkel systeem kan absolute veiligheid garanderen."],
        ["Kan ik wisselen tussen licht en donker thema?", "Ja. Kies Licht, Donker of Systeem en de voorkeur wordt onthouden."],
      ],
    },
    footer: {
      tagline: "Intelligente persoonlijke financiën voor overzicht, discipline en blijvende welvaart.",
      product: "Product", productLinks: ["Functies", "AI-assistent", "Beveiliging"],
      resources: "Bronnen", resourcesLinks: ["Hoe het werkt", "Veelgestelde vragen"],
      account: "Account",
    },
    auth: {
      backToHome: "Terug naar Home",
      brandTitle: "Je financiële commandocentrum staat klaar.",
      brandDescription: "Blijf bouwen aan overzicht, discipline en blijvende welvaart.",
      brandPrivacy: "Je privacycontroles, sessiekeuzes en financiële exports blijven in jouw handen.",
      formTitle: { login: "Welkom terug", register: "Maak je account aan", reset: "Wachtwoord opnieuw instellen" },
      formSubtitle: {
        login: "Log in om verder te gaan naar je Money Mind financiële commandocentrum.",
        register: "Begin met het bouwen van je privé financiële commandocentrum.",
        reset: "Voer je e-mailadres in en we sturen instructies om je wachtwoord opnieuw in te stellen.",
      },
      fields: {
        fullName: "Volledige naam", email: "E-mailadres", password: "Wachtwoord", confirmPassword: "Bevestig wachtwoord",
        passwordHelp: "Gebruik minimaal 6 tekens. Kies een uniek wachtwoord dat je nergens anders gebruikt.",
        rememberMe: "Onthoud mij", forgotPassword: "Wachtwoord vergeten?",
      },
      submit: { wait: "Even geduld…", reset: "Verstuur Resetlink", register: "Account Maken", login: "Inloggen" },
      backToSignIn: "Terug naar Inloggen",
      orDivider: "of",
      google: "Doorgaan met Google",
      switchToRegister: "Nog geen account? Account maken",
      switchToLogin: "Al een account? Inloggen",
      legal: { privacy: "Privacybeleid", terms: "Servicevoorwaarden", help: "Help" },
    },
    demo: {
      title: "Financieel Commandocentrum", subtitle: "Demo-overzicht", status: "Privé werkruimte",
      netWorth: "Netto Vermogen", monthlyIncome: "Maandinkomen", totalSavings: "Totaal Spaargeld", healthScore: "Gezondheidsscore",
      cashFlow: "Cashflow", last6Months: "Laatste 6 maanden", monthlyBudget: "Maandbudget",
      needs: "Behoeften", goals: "Doelen", savings: "Sparen",
      savingsGoals: "Spaardoelen", emergencyFund: "Noodfonds", homeDeposit: "Aanbetaling huis",
      recentTransactions: "Recente transacties", salary: "Salaris", utilities: "Nutsvoorzieningen",
      aiInsight: "AI-inzicht", aiInsightText: "Je spaarpercentage beweegt in de goede richting.",
    },
  },
}

function copyFor(language) {
  return COPY[language] || COPY.en
}

const PUBLIC_AUTH_VIEWS = ["login", "register", "reset"]
function publicViewFromLocation() {
  const hash = location.hash.slice(1)
  return PUBLIC_AUTH_VIEWS.includes(hash) ? hash : (location.hash ? "login" : "home")
}

function DashboardPreview({ t, compact = false }) {
  return <div className={`demo-dashboard public-glass ${compact ? "demo-dashboard-compact" : ""}`} aria-label="Example Money Mind dashboard using demo data">
    <div className="demo-head"><div><span>{t.title}</span><strong>{t.subtitle}</strong></div><span className="demo-status">{t.status}</span></div>
    <div className="demo-metrics"><div><span>{t.netWorth}</span><strong>SRD 123,450</strong></div><div><span>{t.monthlyIncome}</span><strong>SRD 9,000</strong></div><div><span>{t.totalSavings}</span><strong>SRD 3,350</strong></div><div><span>{t.healthScore}</span><strong>82 / 100</strong></div></div>
    <div className="demo-main"><div className="demo-chart"><div className="demo-chart-title"><strong>{t.cashFlow}</strong><span>{t.last6Months}</span></div><svg viewBox="0 0 500 160" role="img" aria-label="Demo cash-flow trend"><path className="chart-grid" d="M0 30H500M0 75H500M0 120H500"/><path className="chart-area" d="M0 135 C55 120 70 85 120 98 S205 118 250 64 S330 88 380 45 S450 62 500 20 L500 160 L0 160Z"/><path className="chart-line" d="M0 135 C55 120 70 85 120 98 S205 118 250 64 S330 88 380 45 S450 62 500 20"/></svg></div><div className="demo-budget"><strong>{t.monthlyBudget}</strong><div><span>{t.needs}</span><i><b style={{width:"72%"}} /></i></div><div><span>{t.goals}</span><i><b style={{width:"58%"}} /></i></div><div><span>{t.savings}</span><i><b style={{width:"84%"}} /></i></div></div></div>
    {!compact && <div className="demo-bottom"><div><strong>{t.savingsGoals}</strong><p>{t.emergencyFund} <span>80%</span></p><p>{t.homeDeposit} <span>46%</span></p></div><div><strong>{t.recentTransactions}</strong><p>{t.salary} <span className="positive">+ SRD 9,000</span></p><p>{t.utilities} <span>− SRD 420</span></p></div><div className="demo-ai"><Sparkles size={17}/><strong>{t.aiInsight}</strong><p>{t.aiInsightText}</p></div></div>}
  </div>
}

function PublicHeader({ view, setView, t }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => { function key(e){if(e.key==="Escape")setOpen(false)} document.addEventListener("keydown",key); document.body.style.overflow=open?"hidden":""; return()=>{document.removeEventListener("keydown",key);document.body.style.overflow=""} }, [open])
  const go = (id) => { setOpen(false); if(view !== "home") { setView("home"); setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:"smooth"}),20) } else document.getElementById(id)?.scrollIntoView({behavior:"smooth"}) }
  return <><div className="public-header-veil" aria-hidden="true" /><header className="public-header public-glass"><button className="public-brand" onClick={()=>setView("home")} aria-label="Money Mind home"><SidebarLogo /></button><nav className="public-nav" aria-label="Public navigation"><button onClick={()=>go("features")}>{t.nav.features}</button><button onClick={()=>go("how-it-works")}>{t.nav.how}</button><button onClick={()=>go("ai-guidance")}>{t.nav.ai}</button><button onClick={()=>go("security")}>{t.nav.security}</button><button onClick={()=>go("faq")}>{t.nav.resources}</button></nav><div className="public-actions"><button className="button-secondary public-desktop-action" onClick={()=>setView("login")}>{t.nav.login}</button><button className="button-primary public-desktop-action" onClick={()=>setView("register")}>{t.nav.create}</button><button ref={menuRef} className="public-menu-button" onClick={()=>setOpen(true)} aria-label="Open menu"><Menu/></button></div></header>{open&&<><button className="public-drawer-backdrop" onClick={()=>{setOpen(false);menuRef.current?.focus()}} aria-label="Close menu"/><aside className="public-drawer public-glass" aria-label="Mobile navigation"><button className="drawer-close" onClick={()=>setOpen(false)} aria-label="Close menu"><X/></button><SidebarLogo/><nav>{[[t.nav.features,"features"],[t.nav.how,"how-it-works"],[t.nav.ai,"ai-guidance"],[t.nav.security,"security"],[t.nav.resources,"faq"]].map(([label,id])=><button key={id} onClick={()=>go(id)}>{label}<ArrowRight size={17}/></button>)}</nav><button className="button-secondary" onClick={()=>{setOpen(false);setView("login")}}>{t.nav.login}</button><button className="button-primary" onClick={()=>{setOpen(false);setView("register")}}>{t.nav.create}</button></aside></>}</>
}

function LandingPage({ setView, t }) {
  const [openFaq, setOpenFaq] = useState(0)
  const icons = [WalletCards, TrendingUp, Target, Brain]
  const capabilityGroups = t.features.groups.map(([title, description, items], i) => [icons[i], title, description, items])
  return <main className="public-page"><section className="public-hero"><div className="hero-copy"><span className="hero-badge">{t.hero.badge}</span><h1>{t.hero.titleLine1}<br/>{t.hero.titleLine2}</h1><p>{t.hero.description}</p><div className="hero-ctas"><button className="button-primary" onClick={()=>setView("register")}>{t.hero.ctaPrimary} <ArrowRight size={18}/></button><button className="button-secondary" onClick={()=>document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>{t.hero.ctaSecondary}</button></div><small><ShieldCheck size={16}/> {t.hero.trust} <b>•</b> {t.hero.trustB} <b>•</b> {t.hero.trustC}</small></div><DashboardPreview t={t.demo}/></section>
    <section className="value-strip public-glass" aria-label="Money Mind values">{[BarChart3,Globe2,Sparkles,LockKeyhole].map((Icon,i)=><div key={t.valueStrip[i]}><Icon/><span>{t.valueStrip[i]}</span></div>)}</section>
    <section id="features" className="public-section"><div className="section-heading"><span>{t.features.eyebrow}</span><h2>{t.features.title}</h2><p>{t.features.description}</p></div><div className="capability-list">{capabilityGroups.map(([Icon,title,description,items],index)=><article key={title} className="capability-row"><div className="capability-number">0{index+1}</div><div className="capability-copy"><Icon/><h3>{title}</h3><p>{description}</p><ul>{items.map(i=><li key={i}><Check size={15}/>{i}</li>)}</ul></div><div className="capability-visual"><span>{title}</span>{items.map((item,i)=><div key={item}><i style={{width:`${72-i*13}%`}}/><small>{item}</small></div>)}</div></article>)}</div></section>
    <section id="how-it-works" className="public-section how-section"><div className="section-heading"><span>{t.how.eyebrow}</span><h2>{t.how.title}</h2></div><div className="steps">{t.how.steps.map(([n,title,text])=><article key={n}><b>{n}</b><h3>{title}</h3><p>{text}</p></article>)}</div></section>
    <section id="ai-guidance" className="public-section ai-section"><div><Sparkles/><h2>{t.ai.title}</h2><p>{t.ai.description}</p><div className="prompt-list">{t.ai.prompts.map(p=><span key={p}>{p}</span>)}</div></div><div className="ai-conversation public-glass"><div className="ai-user">{t.ai.demoQuestion}</div><div className="ai-answer"><Sparkles size={18}/><p>{t.ai.demoAnswer}</p></div><small>{t.ai.demoLabel}</small></div><p className="ai-disclaimer">{t.ai.disclaimer}</p></section>
    <section id="security" className="public-section security-section"><div className="section-heading"><span>{t.security.eyebrow}</span><h2>{t.security.title}</h2><p>{t.security.description}</p></div><div className="security-list">{[LockKeyhole,ShieldCheck,BarChart3,Globe2].map((Icon,i)=><article key={t.security.items[i][0]}><Icon/><div><h3>{t.security.items[i][0]}</h3><p>{t.security.items[i][1]}</p></div></article>)}</div></section>
    <section className="public-section ecosystem"><div className="section-heading"><span>{t.ecosystem.eyebrow}</span><h2>{t.ecosystem.title}</h2></div><div className="ecosystem-orbit public-glass"><strong>{t.ecosystem.label}</strong>{t.ecosystem.items.map(x=><span key={x}>{x}</span>)}</div></section>
    <section className="conversion public-glass"><div><h2>{t.conversion.title}</h2><p>{t.conversion.description}</p></div><div><button className="button-primary" onClick={()=>setView("register")}>{t.conversion.ctaPrimary}</button><button className="button-secondary" onClick={()=>document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>{t.conversion.ctaSecondary}</button></div></section>
    <section id="faq" className="public-section faq-section"><div className="section-heading"><span>{t.faq.eyebrow}</span><h2>{t.faq.title}</h2></div><div className="faq-list">{t.faq.items.map(([q,a],i)=><article key={q}><button onClick={()=>setOpenFaq(openFaq===i?-1:i)} aria-expanded={openFaq===i}>{q}<ChevronDown className={openFaq===i?"rotate-180":""}/></button>{openFaq===i&&<p>{a}</p>}</article>)}</div></section>
  </main>
}

function AuthPage({ auth, view, setView, t }) {
  const [showPassword, setShowPassword] = useState(false)
  const isRegister = view === "register"
  const isReset = view === "reset"
  const setAuthMode = auth.setMode
  const a = t.auth
  useEffect(()=>{setAuthMode(isRegister?"register":"login")},[isRegister,setAuthMode])
  const titleKey = isReset?"reset":isRegister?"register":"login"
  return <main className="auth-page"><div className="auth-toolbar"><button onClick={()=>setView("home")} className="button-secondary"><ArrowRight className="rotate-180" size={17}/> {a.backToHome}</button></div><section className="auth-layout"><div className="auth-brand-panel"><div><h1>{a.brandTitle}</h1><p>{a.brandDescription}</p></div><DashboardPreview t={t.demo} compact/><p className="auth-privacy"><ShieldCheck/> {a.brandPrivacy}</p></div><div className="auth-form-panel"><div className="auth-form-logo"><SidebarLogo markOnly/></div><form onSubmit={isReset?auth.handleForgotPassword:auth.handleAuth} className="auth-card public-glass"><h2>{a.formTitle[titleKey]}</h2><p>{a.formSubtitle[titleKey]}</p>{isRegister&&<label>{a.fields.fullName}<input value={auth.fullName} onChange={e=>auth.setFullName(e.target.value)} autoComplete="name" required /></label>}<label>{a.fields.email}<input type="email" value={auth.email} onChange={e=>auth.setEmail(e.target.value)} autoComplete="email" required /></label>{!isReset&&<><label>{a.fields.password}<span className="password-wrap"><input type={showPassword?"text":"password"} value={auth.password} onChange={e=>auth.setPassword(e.target.value)} autoComplete={isRegister?"new-password":"current-password"} required/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff/>:<Eye/>}</button></span></label>{isRegister&&<><label>{a.fields.confirmPassword}<input type={showPassword?"text":"password"} value={auth.confirmPassword} onChange={e=>auth.setConfirmPassword(e.target.value)} autoComplete="new-password" required/></label><small className="password-help">{a.fields.passwordHelp}</small></>} {!isRegister&&<div className="auth-options"><label><input type="checkbox" checked={auth.rememberMe} onChange={e=>auth.setRememberMe(e.target.checked)}/> {a.fields.rememberMe}</label><button type="button" onClick={()=>setView("reset")}>{a.fields.forgotPassword}</button></div>}</>}{(auth.authError||auth.resetMessage)&&<div className={auth.authError?"auth-error":"auth-status"} role="status" aria-live="polite">{auth.authError||auth.resetMessage}</div>}<button className="button-primary auth-submit" disabled={auth.submitting}>{auth.submitting?a.submit.wait:isReset?a.submit.reset:isRegister?a.submit.register:a.submit.login}</button>{isReset?<button type="button" className="auth-switch" onClick={()=>setView("login")}>{a.backToSignIn}</button>:<><div className="auth-divider"><span>{a.orDivider}</span></div><button type="button" onClick={auth.handleGoogleLogin} disabled={auth.submitting} className="google-button"><b>G</b> {a.google}</button><button type="button" className="auth-switch" onClick={()=>setView(isRegister?"login":"register")}>{isRegister?a.switchToLogin:a.switchToRegister}</button></>}<div className="auth-legal"><button type="button">{a.legal.privacy}</button><span>•</span><button type="button">{a.legal.terms}</button><span>•</span><button type="button">{a.legal.help}</button></div></form></div></section></main>
}

function Footer({ setView, t }) {
  return <footer className="public-footer"><div><SidebarLogo/><p>{t.footer.tagline}</p></div><div><strong>{t.footer.product}</strong><a href="#features">{t.footer.productLinks[0]}</a><a href="#ai-guidance">{t.footer.productLinks[1]}</a><a href="#security">{t.footer.productLinks[2]}</a></div><div><strong>{t.footer.resources}</strong><a href="#how-it-works">{t.footer.resourcesLinks[0]}</a><a href="#faq">{t.footer.resourcesLinks[1]}</a></div><div><strong>{t.footer.account}</strong><button onClick={()=>setView("login")}>{t.nav.login}</button><button onClick={()=>setView("register")}>{t.nav.create}</button></div><p className="footer-bottom">© {new Date().getFullYear()} Money Mind · Upgrade v2.0</p></footer>
}

export default function PublicExperience({ auth, settings, updateSetting }) {
  const [view, setViewState] = useState(publicViewFromLocation)
  const language = settings.language === "nl" ? "nl" : "en"
  const t = copyFor(language)
  useEffect(() => { const sync = () => setViewState(publicViewFromLocation()); window.addEventListener("hashchange", sync); window.addEventListener("popstate", sync); return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync) } }, [])
  function setView(value){setViewState(value);history.pushState(null,"",value==="home"?location.pathname:`#${value}`);window.scrollTo({top:0})}
  return <div className="public-shell">{view==="home"?<><PublicHeader view={view} setView={setView} t={t}/><LandingPage setView={setView} t={t}/><Footer setView={setView} t={t}/></>:<AuthPage auth={auth} view={view} setView={setView} t={t}/>}</div>
}
