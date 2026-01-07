import { useState } from "react";
import { Modal } from "@coinbase/cds-web/overlays/modal/Modal";
import { ModalHeader } from "@coinbase/cds-web/overlays/modal/ModalHeader";
import { ModalBody } from "@coinbase/cds-web/overlays/modal/ModalBody";
import { ModalFooter } from "@coinbase/cds-web/overlays/modal/ModalFooter";
import { Button } from "@coinbase/cds-web/buttons";
import { VStack } from "@coinbase/cds-web/layout";
import { Text } from "@coinbase/cds-web/typography/Text";
import { Select } from "@coinbase/cds-web/alpha/select";

type ConflictResolutionModalProps = {
	visible: boolean;
	existingProposal: { id: number; destinationName: string };
	vacation: { year: number } | null;
	onResolution: (action: "save_for_later" | "replace" | "throw_out") => void;
	onCancel: () => void;
};

export function ConflictResolutionModal({ visible, existingProposal, vacation, onResolution, onCancel }: ConflictResolutionModalProps) {
	const [selectedAction, setSelectedAction] = useState<string | null>(null);

	const options = [
		{
			value: "replace",
			label: "Replace",
			description: "Delete old proposal from this cycle and submit new one",
		},
		{
			value: "throw_out",
			label: "Throw Out New Proposal",
			description: "Discard your work and keep existing proposal",
		},
		{
			value: "save_for_later",
			label: "Save for Later",
			description: "Create new proposal without linking to this vacation",
		},
	];

	function handleConfirm() {
		if (selectedAction) {
			onResolution(selectedAction as "save_for_later" | "replace" | "throw_out");
		}
	}

	return (
		<Modal visible={visible} onRequestClose={onCancel}>
			<ModalHeader title="Existing Proposal Found" closeAccessibilityLabel="Close" />
			<ModalBody tabIndex={0}>
				<VStack gap={4}>
					<Text>
						You already have a proposal for the {vacation?.year} vacation: <strong>{existingProposal.destinationName}</strong>
					</Text>
					<Text color="fgMuted">What would you like to do with your existing proposal?</Text>
					<Select
						label="Choose an action"
						value={selectedAction}
						onChange={setSelectedAction}
						options={options}
						placeholder="Select an option"
					/>
				</VStack>
			</ModalBody>
			<ModalFooter
				primaryAction={
					<Button onClick={handleConfirm} disabled={!selectedAction}>
						Confirm
					</Button>
				}
				secondaryAction={
					<Button variant="secondary" onClick={onCancel}>
						Cancel
					</Button>
				}
			/>
		</Modal>
	);
}
