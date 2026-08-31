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

export default function SupportScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/" asChild>
        <Pressable style={styles.backLink} hitSlop={8}>
          <Text style={styles.backLinkText}>← Back to Splitzy</Text>
        </Pressable>
      </Link>

      <Text style={styles.title}>Splitzy Support</Text>
      <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

      <Text style={styles.paragraph}>
        Splitzy is a free app for tracking and dividing shared costs with friends and groups. If you
        need help, have found a bug, or want to request a feature, email{" "}
        <Text style={styles.bold}>{CONTACT_EMAIL}</Text> and we&apos;ll get back to you.
      </Text>

      <Section title="Getting started">
        <Text style={styles.paragraph}>
          Create an account with your email and name. You&apos;ll be asked to verify your email
          address — open the link in the message we send you, then tap{" "}
          <Text style={styles.bold}>I&apos;ve verified</Text> on the Account screen.
        </Text>
      </Section>

      <Section title="Adding a friend">
        <Text style={styles.paragraph}>
          Go to the <Text style={styles.bold}>Friends</Text> tab and tap the add-friend button, then
          enter your friend&apos;s email. They need a Splitzy account under that same email for the
          connection to work.
        </Text>
      </Section>

      <Section title="Creating a group">
        <Text style={styles.paragraph}>
          Open the <Text style={styles.bold}>Groups</Text> tab and tap{" "}
          <Text style={styles.bold}>Create a group</Text>. Groups are for splitting expenses among
          more than one friend — trips, roommates, or recurring shared costs. You can add or remove
          members later from the group&apos;s Manage Members screen.
        </Text>
      </Section>

      <Section title="Adding and splitting an expense">
        <Text style={styles.paragraph}>
          Tap the expense button, choose the friend or group it&apos;s with, then enter a
          description, amount, and date. Choose who paid and how to split it —{" "}
          <Text style={styles.bold}>Equal</Text>, <Text style={styles.bold}>Percentage</Text>, or{" "}
          <Text style={styles.bold}>Exact</Text> amounts. You can backdate an expense to the day it
          actually happened.
        </Text>
      </Section>

      <Section title="How balances are calculated">
        <Text style={styles.paragraph}>
          For each person, Splitzy adds up what they paid and subtracts their share of every expense.
          The result is shown as how much you owe them or they owe you. Editing or deleting an
          expense updates all affected balances immediately.
        </Text>
      </Section>

      <Section title="Activity history">
        <Text style={styles.paragraph}>
          The <Text style={styles.bold}>Activity</Text> tab logs every expense added or edited, plus
          friend and group changes, so there&apos;s always a record of what happened and when.
        </Text>
      </Section>

      <Section title="Deleting your account">
        <Text style={styles.paragraph}>
          Go to <Text style={styles.bold}>Account → Delete account</Text>. This immediately removes
          your ability to sign in. Because Splitzy is a shared ledger, some records you were part of
          may be retained so the history stays accurate for the other people involved. See the{" "}
          <Link href="/privacy" asChild>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Link>{" "}
          for details.
        </Text>
      </Section>

      <Section title="Cost">
        <Text style={styles.paragraph}>
          Splitzy is free. There are no subscriptions, no premium tier, and no feature paywalls.
        </Text>
      </Section>

      <Section title="Contact">
        <Text style={styles.paragraph}>
          For anything not covered here, email <Text style={styles.bold}>{CONTACT_EMAIL}</Text>.
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
  linkText: {
    color: "#2f6feb",
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
