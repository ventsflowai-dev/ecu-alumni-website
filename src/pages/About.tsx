import { Layout } from "@/components/Layout";
import { SectionHeader } from "@/components/SectionHeader";
import { PartnerCTA } from "@/components/PartnerCTA";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import about from "@/assets/about-fellowship.jpg";

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
    <section className="bg-gradient-hero text-primary-foreground">
      <div className="container py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-soft mb-4">Our Story</div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 text-balance">About Us</h1>
          <p className="text-lg text-primary-foreground/85 leading-relaxed">Sustaining the legacy of the Word and prayer for generations to come.</p>
        </div>
      </div>
    </section>

    <section className="container py-20 grid lg:grid-cols-5 gap-12 items-start">
      <div className="lg:col-span-3 space-y-5 text-foreground/80 leading-relaxed">
        <p>Evangelical Christian Union (ECU) is one of the oldest Christian fellowships in Obafemi Awolowo University, as old as the university itself. For decades, ECU has raised men and women grounded in the Word, committed to excellence, and passionate about kingdom impact.</p>
        <p>Over the years, the fellowship has been widely known as a place of the Word and prayer — a spiritual home where students are deeply rooted in sound biblical teaching, fervent intercession, and intentional discipleship. ECU has consistently emphasized spiritual growth, character formation, and leadership development, shaping lives far beyond the campus walls.</p>
        <p>Today, graduates of the fellowship are Christian leaders, pastors, missionaries, professionals, and business men and women making significant impact across various sectors and nations of the world. From ministry platforms to corporate boardrooms, from local communities to global institutions, ECU alumni continue to reflect the values, discipline, and spiritual foundation nurtured during their time in the fellowship.</p>
        <p>The ECU Alumni Fellowship exists to sustain this legacy, strengthen the bond between generations, and ensure that the altar of the Word and prayer remains strong for those coming behind.</p>
      </div>
      <div className="lg:col-span-2">
        <img src={about} alt="ECU alumni" className="rounded-2xl shadow-elegant w-full" loading="lazy" width={1280} height={896} />
      </div>
    </section>

    <section className="bg-secondary/40 py-20">
      <div className="container grid md:grid-cols-3 gap-8">
        <Card className="p-8">
          <h3 className="font-display text-2xl font-bold mb-4 text-primary">Our History</h3>
          <p className="text-muted-foreground leading-relaxed">Evangelical Christian Union (ECU) was established alongside Obafemi Awolowo University and has remained a pillar of spiritual growth on campus. Through seasons and generations, ECU has stood firm in its commitment to sound doctrine, discipleship, and excellence.</p>
        </Card>
        <Card className="p-8">
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
        <Card className="p-8">
          <h3 className="font-display text-2xl font-bold mb-4 text-primary">Our Purpose</h3>
          <p className="text-muted-foreground leading-relaxed">The ECU Alumni Fellowship exists to connect past members across generations and locations, fostering spiritual accountability, mentorship, and strategic support for the undergraduate fellowship.</p>
        </Card>
      </div>
    </section>

    <PartnerCTA />
  </Layout>
);

export default About;
