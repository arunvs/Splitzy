import { Link } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { centeredContent } from "@/constants/layout";

const LAST_UPDATED = "August 2026";
const CONTACT_EMAIL = "admin@oryn.online";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" asChild>
        <Pressable style={styles.backLink} hitSlop={8}>
          <Text style={styles.backLinkText}>← Back to Splitzy</Text>
        </Pressable>
      </Link>

      <Text style={styles.title}>Splitzy Privacy Policy</Text>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

      <Text style={styles.paragraph}>
        Splitzy is an expense-splitting app for tracking and dividing shared costs with friends
        and groups. This page explains what information Splitzy collects, how it&apos;s used, and
        the choices you have.
      </Text>

      <Section title="Information we collect">
        <Text style={styles.paragraph}>
          When you create an account, we collect your <Text style={styles.bold}>email address</Text>{" "}
          and <Text style={styles.bold}>name</Text>. Your password is handled entirely by Firebase
          Authentication (our backend provider) — Splitzy never sees or stores your raw password.
        </Text>
        <Text style={styles.paragraph}>
          When you use the app, we store the data you create: expenses (description, amount, date,
          who paid, how it&apos;s split), friend connections, and group names/descriptions/membership.
        </Text>
        <Text style={styles.paragraph}>
          If something goes wrong, we may log basic technical error information (an error message
          and the screen it happened on) to help us fix bugs. Splitzy does not use any third-party
          analytics or advertising SDKs, and does not track your activity for advertising purposes.
        </Text>
      </Section>

      <Section title="How your information is shared">
        <Text style={styles.paragraph}>
          Your name and email are visible to other Splitzy users you interact with — for example, a
          friend can look you up by email to add you, and group members can see who&apos;s in a
          shared group. Expense details are visible only to the people they involve (a friend
          you&apos;ve split with, or a group you&apos;re a member of).
        </Text>
        <Text style={styles.paragraph}>
          We use Google Firebase to store and process this data on our behalf. We do not sell your
          data, and we do not share it with advertisers. Firebase&apos;s own privacy practices are
          described at{" "}
          <Text style={styles.bold}>https://firebase.google.com/support/privacy</Text>.
        </Text>
      </Section>

      <Section title="Data retention and deletion">
        <Text style={styles.paragraph}>
          You can delete your account at any time from Account → Delete account. This immediately
          removes your ability to sign in. Because Splitzy is a shared ledger between multiple
          people, some records you were part of (such as an expense you split with a friend, or
          group activity history) may be retained afterward, so the shared financial history stays
          accurate for the other people involved.
        </Text>
      </Section>

      <Section title="Security">
        <Text style={styles.paragraph}>
          Access to your data is restricted to you and the people you directly interact with in the
          app — friends you&apos;ve connected with and members of groups you belong to.
        </Text>
      </Section>

      <Section title="Children's privacy">
        <Text style={styles.paragraph}>
          Splitzy is not directed at children under 13, and we do not knowingly collect information
          from children under 13.
        </Text>
      </Section>

      <Section title="Changes to this policy">
        <Text style={styles.paragraph}>
          We may update this policy from time to time. The &quot;Last updated&quot; date above
          reflects the most recent change.
        </Text>
      </Section>

      <Section title="Contact">
        <Text style={styles.paragraph}>
          Questions about this policy or your data can be sent to{" "}
          <Text style={styles.bold}>{CONTACT_EMAIL}</Text>.
        </Text>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    ...centeredContent,
  },
  backLink: {
    marginBottom: 16,
  },
  backLinkText: {
    color: "#2f6feb",
    fontWeight: "600",
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  updated: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: "#333",
    marginBottom: 10,
  },
  bold: {
    fontWeight: "600",
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
});
