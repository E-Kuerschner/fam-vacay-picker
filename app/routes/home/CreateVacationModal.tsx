import { Form } from "react-router";
import { useState } from "react";
import { Modal } from "@coinbase/cds-web/overlays/modal/Modal";
import { ModalHeader } from "@coinbase/cds-web/overlays/modal/ModalHeader";
import { ModalBody } from "@coinbase/cds-web/overlays/modal/ModalBody";
import { ModalFooter } from "@coinbase/cds-web/overlays/modal/ModalFooter";
import { Chip } from "@coinbase/cds-web/chips";
import { Button } from "@coinbase/cds-web/buttons";
import { TextInput } from "@coinbase/cds-web/controls";
import { HStack, VStack } from "@coinbase/cds-web/layout";
import { Text } from "@coinbase/cds-web/typography/Text";

type CreateVacationModalProps = {
	visible: boolean;
	onRequestClose: () => void;
	actionData?: { error?: string };
};

export function CreateVacationModal({ visible, onRequestClose, actionData }: CreateVacationModalProps) {
	const [year, setYear] = useState("");
	const currentYear = new Date().getFullYear();

	const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

	return (
		<Modal visible={visible} onRequestClose={onRequestClose}>
			<Form method="post" id="create-vacation-form">
				<ModalHeader title="Create New Vacation" closeAccessibilityLabel="Close" />
				<ModalBody tabIndex={0}>
					<VStack gap={3}>
						<Text color="fgMuted">Select the year you want to plan a vacation for:</Text>
						<HStack gap={1.5}>
							{years.map((yearOption, index) => (
								<Chip key={yearOption} invertColorScheme={year === yearOption.toString()} onClick={() => setYear(yearOption.toString())}>
									{yearOption}
								</Chip>
							))}
						</HStack>
						<TextInput readOnly name="year" label="Year" labelVariant="inside" type="number" min={currentYear} value={year} required />
						{actionData?.error && (
							<Text font="label1" color="fgNegative">
								{actionData.error}
							</Text>
						)}
					</VStack>
				</ModalBody>
				<ModalFooter
					primaryAction={
						<Button type="submit" form="create-vacation-form">
							Create Vacation
						</Button>
					}
					secondaryAction={
						<Button variant="secondary" onClick={onRequestClose}>
							Cancel
						</Button>
					}
				/>
			</Form>
		</Modal>
	);
}
