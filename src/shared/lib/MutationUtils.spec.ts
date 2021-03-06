import {
    somaticMutationRate, germlineMutationRate, countUniqueMutations, groupMutationsByGeneAndPatientAndProteinChange,
    countDuplicateMutations, uniqueGenomicLocations, updateMissingGeneInfo, countMutationsByProteinChange
} from "./MutationUtils";
import * as _ from 'lodash';
import { assert, expect } from 'chai';
import sinon from 'sinon';
import {Gene, MolecularProfile, Mutation} from "../api/generated/CBioPortalAPI";
import {initMutation} from "test/MutationMockUtils";
import { MUTATION_STATUS_GERMLINE } from "shared/constants";

describe('MutationUtils', () => {
    let somaticMutations: Mutation[];
    let germlineMutations: Mutation[];
    let molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile};
    let mutationsToCount: Mutation[];

    before(()=>{
        molecularProfileIdToMolecularProfile = {
            'GP1':{
                studyId: 'STUDY1'
            } as MolecularProfile
        };
        somaticMutations = [
            initMutation({ // mutation
                sampleId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                molecularProfileId:"GP1"
             }),
            initMutation({ // mutation in same gene, same patient
                sampleId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                molecularProfileId:"GP1"
             }),
            initMutation({ // mutation in same patient different gene
                sampleId: "PATIENT2",
                gene: {
                    hugoGeneSymbol: "PIK3CA",
                },
                molecularProfileId:"GP1"
             })
        ];
        germlineMutations = [
            initMutation({ // mutation
                sampleId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                mutationStatus: MUTATION_STATUS_GERMLINE,
                molecularProfileId:"GP1"
             }),
            initMutation({ // mutation in same gene, same patient
                sampleId: "PATIENT1",
                gene: {
                    hugoGeneSymbol: "BRCA1",
                },
                mutationStatus: MUTATION_STATUS_GERMLINE,
                molecularProfileId:"GP1"
             }),
            initMutation({ // mutation in same patient different gene
                sampleId: "PATIENT2",
                gene: {
                    hugoGeneSymbol: "BRCA2",
                },
                mutationStatus: MUTATION_STATUS_GERMLINE,
                molecularProfileId:"GP1"
             })
        ];
        mutationsToCount = [
            initMutation({ // mutation
                sampleId: "P1_sample1",
                patientId: "P1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"

            }),
            initMutation({ // mutation
                sampleId: "P1_sample2",
                patientId: "P1",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"
            }),
            initMutation({ // mutation
                sampleId: "P2_sample1",
                patientId: "P2",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"
            }),
            initMutation({ // mutation
                sampleId: "P2_sample2",
                patientId: "P2",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"
            }),
            initMutation({ // mutation
                sampleId: "P3_sample1",
                patientId: "P3",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 66,
                proteinChange: "D66B"
            }),
            initMutation({ // mutation
                sampleId: "P4_sample1",
                patientId: "P4",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 666,
                proteinChange: "D666C"
            }),
            initMutation({ // mutation
                sampleId: "P4_sample2",
                patientId: "P4",
                gene: {
                    hugoGeneSymbol: "TP53",
                },
                proteinPosStart: 666,
                proteinChange: "D666F"
            }),
        ];
    });

    describe('groupMutationsByGeneAndPatientAndProteinChange', () => {
        it("groups mutations correctly by gene, patient, and protein change", () => {
            const grouped = groupMutationsByGeneAndPatientAndProteinChange(mutationsToCount);

            assert.equal(grouped["TP53_P1_D66B"].length, 2,
                "There should be 2 mutations for TP53_P1_D66B");
            assert.equal(grouped["TP53_P2_D66B"].length, 2,
                "There should be 2 mutations for TP53_P2_D66B");
            assert.equal(grouped["TP53_P3_D66B"].length, 1,
                "There should be 1 mutation for TP53_P3_D66B");
            assert.equal(grouped["TP53_P4_D666C"].length, 1,
                "There should be 1 mutation for TP53_P4_D666C");
            assert.equal(grouped["TP53_P4_D666F"].length, 1,
                "There should be 1 mutation for TP53_P4_D666F");
        });
    });

    describe('countMutationsByProteinChange', () => {
        it("returns an empty array when there are no mutations", () => {
            assert.equal(countMutationsByProteinChange([]).length, 0,
                "no mutation count for an empty input");
        });

        it("counts and sorts mutations by protein change values", () => {
            const mutationCountByProteinChange = countMutationsByProteinChange(mutationsToCount);

            assert.equal(mutationCountByProteinChange.length, 3,
                "there should be 3 unique protein change values");

            assert.deepEqual(mutationCountByProteinChange[0], {proteinChange: "D66B", count: 5},
                "first protein change should be D66B with 5 count");

            assert.deepEqual(mutationCountByProteinChange[1], {proteinChange: "D666C", count: 1},
                "second protein change should be D666C with 1 count");

            assert.deepEqual(mutationCountByProteinChange[2], {proteinChange: "D666F", count: 1},
                "third protein change should be D666F with 1 count");
        });
    });

    describe('countUniqueMutations', () => {
        it("counts unique mutations as zero when there are no mutations", () => {
            assert.equal(countUniqueMutations([]), 0,
                "total number of unique mutations should be 0");
        });

        it("counts unique mutations correctly", () => {
            const count = countUniqueMutations(mutationsToCount);

            assert.equal(count, 5,
                "total number of unique mutations should be 5");
        });
    });

    describe('countDuplicateMutations', () => {
        it("counts duplicate mutations as zero when there are no mutations", () => {
            assert.equal(countDuplicateMutations({}), 0,
                "total number of duplicate mutations should be 0");
        });

        it("counts duplicates correctly for mutations grouped by patients", () => {
            const grouped = groupMutationsByGeneAndPatientAndProteinChange(mutationsToCount);
            const count = countDuplicateMutations(grouped);

            assert.equal(count, 2,
                "total number of duplicate mutations should be 2");
        });
    });

    describe('somaticMutationRate', () => {
        it("calculates rate correctly", () => {
            // only one of the patients has a TP53 mutation
            let result:number = 
                somaticMutationRate(
                    "TP53",
                    somaticMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 50);

            // No non-existing gene mutations
            result = 
                somaticMutationRate(
                    "NASDASFASG",
                    somaticMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 0);

            // when nr of given patientIds is 1 it should give 100% (not sure if
            // this should be an error instead)
            result = 
                somaticMutationRate(
                    "PIK3CA",
                    somaticMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 100);

            // germline mutations should be ignored
            result = 
                somaticMutationRate(
                    "BRCA1",
                    somaticMutations.concat(germlineMutations),
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 0);

            // ignore all mutations for non existent patient id
            result = 
                somaticMutationRate(
                    "PIK3CA",
                    somaticMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'XXXX'}]
                );
            assert.equal(result, 0);
        });
    });

    describe('germlineMutationRate', () => {
        it("calculates rate correctly", () => {
            // only half of patients have BRCA1 mutation
            let result:number =
                germlineMutationRate(
                    "BRCA1",
                    germlineMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 50);

            // somatic mutations should be ignored
            result = 
                germlineMutationRate(
                    "PIK3CA",
                    germlineMutations.concat(somaticMutations),
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 0);

            // ignore all mutations for non existent patient id
            result = 
                germlineMutationRate(
                    "BRCA2",
                    germlineMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'XXXX'}]
                );
            assert.equal(result, 0);

            // No non-existing gene mutations
            result = 
                germlineMutationRate(
                    "NASDASFASG",
                    germlineMutations,
                    molecularProfileIdToMolecularProfile,
                    [{studyId:'STUDY1', sampleId:'PATIENT1'}, {studyId:'STUDY1', sampleId:'PATIENT2'}]
                );
            assert.equal(result, 0);
        });
    });

    describe('uniqueGenomicLocations', () => {
        it('extracts unique genomic locations', () => {
            const mutations = [
                initMutation({
                    gene: {
                        chromosome: "7"
                    },
                    startPosition: 111,
                    endPosition: 111,
                    referenceAllele: "T",
                    variantAllele: "C",
                }),
                initMutation({
                    gene: {
                        chromosome: "7"
                    },
                    startPosition: 111,
                    endPosition: 111,
                    referenceAllele: "T",
                    variantAllele: "C",
                }),
                initMutation({
                    gene: {
                        chromosome: "17"
                    },
                    startPosition: 66,
                    endPosition: 66,
                    referenceAllele: "T",
                    variantAllele: "A",
                }),
                initMutation({
                    gene: {
                        chromosome: "17"
                    },
                    startPosition: 66,
                    endPosition: 66,
                    referenceAllele: "T",
                    variantAllele: "A",
                }),
                initMutation({
                    gene: {
                        chromosome: "4"
                    },
                    startPosition: 11,
                    endPosition: 11,
                    referenceAllele: "-",
                    variantAllele: "G",
                }),
            ];

            const genomicLocations = uniqueGenomicLocations(mutations);

            assert.equal(genomicLocations.length, 3,
                "Duplicate genomic locations should be removed (5 - 2 = 3)");
        });
    });

    describe('updateMissingGeneInfo', () => {

        const genesByHugoSymbol: {[hugoGeneSymbol:string]: Gene} = {
            AR: {
                entrezGeneId: 367,
                hugoGeneSymbol: "AR",
                type: "protein-coding",
                cytoband: "Xq12",
                length: 186588,
                chromosome: "X"
            },
            BRCA1: {
                entrezGeneId: 672,
                hugoGeneSymbol: "BRCA1",
                type: "protein-coding",
                cytoband: "17q21.31",
                length: 81189,
                chromosome: "17"
            },
            BRCA2: {
                entrezGeneId: 675,
                hugoGeneSymbol: "BRCA2",
                type: "protein-coding",
                cytoband: "13q13.1",
                length: 84193,
                chromosome: "13"
            }
        };

        it('adds missing gene information for the mutations', () => {
            const mutations = [
                {
                    gene: {
                        hugoGeneSymbol: "AR",
                    },
                    proteinChange: "L729I",
                },
                {
                    gene: {
                        hugoGeneSymbol: "BRCA1",
                    },
                    proteinChange: "C47W"
                },
                {
                    gene: {
                        hugoGeneSymbol: "BRCA2",
                    },
                    entrezGeneId: undefined,
                    aminoAcidChange: "R2842C"
                }
            ];

            updateMissingGeneInfo(mutations as Partial<Mutation>[], genesByHugoSymbol);

            assert.deepEqual(mutations[0].gene, genesByHugoSymbol["AR"]);
            assert.equal(mutations[0].entrezGeneId, genesByHugoSymbol["AR"].entrezGeneId);
            assert.deepEqual(mutations[1].gene, genesByHugoSymbol["BRCA1"]);
            assert.equal(mutations[1].entrezGeneId, genesByHugoSymbol["BRCA1"].entrezGeneId);
            assert.deepEqual(mutations[2].gene, genesByHugoSymbol["BRCA2"]);
            assert.equal(mutations[2].entrezGeneId, genesByHugoSymbol["BRCA2"].entrezGeneId);
        });

        it('should not overwrite existing gene information', () => {
            const mutations = [
                {
                    gene: {
                        hugoGeneSymbol: "AR",
                        entrezGeneId: -1
                    },
                    entrezGeneId: -1
                }
            ];

            updateMissingGeneInfo(mutations as Partial<Mutation>[], genesByHugoSymbol);

            assert.notEqual(mutations[0].entrezGeneId, genesByHugoSymbol["AR"].entrezGeneId);
            assert.notEqual(mutations[0].gene.entrezGeneId, genesByHugoSymbol["AR"].entrezGeneId);
        });
    });
});
