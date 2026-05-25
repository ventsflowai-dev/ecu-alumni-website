import { Layout } from "@/components/Layout";
import { SectionHeader } from "@/components/SectionHeader";
import { PartnerCTA } from "@/components/PartnerCTA";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/FadeIn";
import about from "/assets/about.jpg";

const beliefs = [
  "The Authority of Scriptures",
  "Salvation through Christ alone",
  "The importance of discipleship",
  "Christ-centered leadership",
  "Spiritual growth",
  "Ministry",
];

const About = () => (
  <Layout>
    <section className="relative bg-black text-primary-foreground overflow-hidden">
      <div className="absolute inset-0">
        <img src={about} alt="ECU Alumni background" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        {/* Base gradient overlay matching brand deep blue */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/95 via-primary/85 to-primary/50" />
        {/* Subtle red brand accent glow over the blue base */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsla(var(--accent)/0.35),transparent_65%)]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-accent/10 mix-blend-overlay" />
      </div>
      <div className="relative container py-28 md:py-36 lg:py-44 z-10">
        <div className="max-w-3xl">
          <FadeIn direction="up" delay={0.1}>
            <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-4">Our Story</div>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 text-balance">About Us</h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.3}>
            <p className="text-lg text-primary-foreground/85 leading-relaxed">Sustaining the legacy of the Word and prayer for generations to come.</p>
          </FadeIn>
        </div>
      </div>
    </section>

    <section className="container py-20 grid lg:grid-cols-5 gap-12 items-start">
      <FadeIn direction="up" className="lg:col-span-3 space-y-5 text-foreground/80 leading-relaxed">
        <p>Evangelical Christian Union (ECU) is one of the oldest Christian fellowships in Obafemi Awolowo University, as old as the university itself. For decades, ECU has raised men and women grounded in the Word, committed to excellence, and passionate about kingdom impact.</p>
        <p>Over the years, the fellowship has been widely known as a place of the Word and prayer — a spiritual home where students are deeply rooted in sound biblical teaching, fervent intercession, and intentional discipleship. ECU has consistently emphasized spiritual growth, character formation, and leadership development, shaping lives far beyond the campus walls.</p>
        <p>Today, graduates of the fellowship are Christian leaders, pastors, missionaries, professionals, and business men and women making significant impact across various sectors and nations of the world. From ministry platforms to corporate boardrooms, from local communities to global institutions, ECU alumni continue to reflect the values, discipline, and spiritual foundation nurtured during their time in the fellowship.</p>
        <p>The ECU Alumni Fellowship exists to sustain this legacy, strengthen the bond between generations, and ensure that the altar of the Word and prayer remains strong for those coming behind.</p>
      </FadeIn>
      <FadeIn direction="left" className="lg:col-span-2">
        <img src={about} alt="ECU alumni" className="rounded-2xl shadow-elegant w-full" loading="lazy" width={1280} height={896} />
      </FadeIn>
    </section>

    <section className="bg-secondary/40 py-20">
      <StaggerContainer className="container grid md:grid-cols-3 gap-8">
        <StaggerItem>
          <Card className="p-8 h-full hover:shadow-elegant transition-smooth">
            <h3 className="font-display text-2xl font-bold mb-4 text-primary">Our History</h3>
            <p className="text-muted-foreground leading-relaxed">Evangelical Christian Union (ECU) was established alongside Obafemi Awolowo University and has remained a pillar of spiritual growth on campus. Through seasons and generations, ECU has stood firm in its commitment to sound doctrine, discipleship, and excellence.</p>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-8 h-full hover:shadow-elegant transition-smooth">
            <h3 className="font-display text-2xl font-bold mb-4 text-primary">Our Core Beliefs</h3>
            <ul className="space-y-2.5">
              {beliefs.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-foreground/80">
                  <Check className="h-5 w-5 text-accent mt-0.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Card>
        </StaggerItem>
        <StaggerItem>
          <Card className="p-8 h-full hover:shadow-elegant transition-smooth">
            <h3 className="font-display text-2xl font-bold mb-4 text-primary">Our Purpose</h3>
            <p className="text-muted-foreground leading-relaxed">The ECU Alumni Fellowship exists to connect past members across generations and locations, fostering spiritual accountability, mentorship, and strategic support for the undergraduate fellowship.</p>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </section>

    <FadeIn direction="up">
      <PartnerCTA />
    </FadeIn>
  </Layout>
);

export default About;
