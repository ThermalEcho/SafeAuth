import {
  PageHeader,
  PrimaryButton,
  Surface,
  colors,
} from "@/components/safeauth-ui";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { authClient } from "@/lib/auth-client";
import { showAlert } from "@/lib/auth-utils";
import { deleteOtpAccount, listOtpAccounts, type OtpAccount } from "@/lib/otp-api";
import { router, type Href } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, View } from "react-native";

const REFRESH_INTERVAL_MS = 1000;

export default function OtpScreen(): React.JSX.Element {
  const [accounts, setAccounts] = useState<OtpAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const requestInFlight = useRef(false);

  const loadAccounts = useCallback(async (): Promise<void> => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;

    try {
      const response = await authClient.getSession();
      if (response.error || !response.data?.user) {
        router.replace("/sign-in");
        return;
      }
      setAccounts(await listOtpAccounts());
    } catch (error: unknown) {
      showAlert("OTP vault unavailable", error instanceof Error ? error.message : "Unknown error.");
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    const intervalId = setInterval(() => void loadAccounts(), REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [loadAccounts]);

  const sortedAccounts = useMemo(
    () => [...accounts].sort((left, right) => left.issuer.localeCompare(right.issuer)),
    [accounts],
  );

  async function removeAccount(id: string): Promise<void> {
    try {
      await deleteOtpAccount(id);
      await loadAccounts();
    } catch (error: unknown) {
      showAlert("Could not delete code", error instanceof Error ? error.message : "Unknown error.");
    }
  }

  function renderAccount({ item }: { item: OtpAccount }): React.JSX.Element {
    const isExpiring = item.remainingSeconds <= 5;

    return (
      <Surface>
        <HStack className="items-center justify-between gap-5">
          <VStack className="min-w-0 flex-1 gap-1">
            <Text selectable className="text-lg font-black text-[#10213A]">
              {item.issuer}
            </Text>
            <Text selectable className="text-sm text-[#607089]">
              {item.accountName}
            </Text>
            <HStack className="mt-2 items-center gap-2">
              <Box
                className={`h-2 w-2 rounded-full ${
                  isExpiring ? "bg-[#E18A2D]" : "bg-[#21A366]"
                }`}
              />
              <Text
                className="text-xs font-bold text-[#607089]"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                Refreshes in {item.remainingSeconds}s
              </Text>
            </HStack>
          </VStack>

          <VStack className="items-end gap-3">
            <Text
              selectable={!isExpiring}
              className={`font-black tracking-[2px] ${
                isExpiring ? "text-base text-[#B76617]" : "text-3xl text-[#10213A]"
              }`}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {isExpiring ? "Refreshing" : item.code}
            </Text>
            <Button
              size="sm"
              variant="outline"
              action="negative"
              className="rounded-xl border-[#F0B4B4] bg-[#FFF8F8]"
              onPress={() => void removeAccount(item.id)}
            >
              <ButtonText className="font-bold text-[#C43131]">Delete</ButtonText>
            </Button>
          </VStack>
        </HStack>
      </Surface>
    );
  }

  return (
    <View style={{ backgroundColor: colors.background, flex: 1 }}>
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        data={sortedAccounts}
        keyExtractor={(item) => item.id}
        renderItem={renderAccount}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <VStack className="mb-7 gap-5">
            <PageHeader
              backTo="/home"
              title="OTP code vault"
              subtitle="Your time-based authentication codes refresh automatically."
            />
            {loading ? (
              <HStack className="items-center gap-3 rounded-2xl bg-[#EAF2FF] p-4">
                <Spinner color="#146EF5" />
                <Text className="font-semibold text-[#315B91]">Syncing your vault...</Text>
              </HStack>
            ) : null}
          </VStack>
        }
        ListEmptyComponent={
          loading ? null : (
            <Surface className="items-center py-10">
              <Text className="text-center text-lg font-bold text-[#10213A]">
                No authenticator codes yet
              </Text>
              <Text className="text-center leading-6 text-[#607089]">
                Add your first account using a secret key or QR code.
              </Text>
            </Surface>
          )
        }
      />
      <Box className="absolute bottom-0 left-0 right-0 border-t border-[#DDE5EF] bg-[#F4F7FB] p-5">
        <PrimaryButton onPress={() => router.push("/otp-create" as Href)}>
          Add OTP code
        </PrimaryButton>
      </Box>
    </View>
  );
}
