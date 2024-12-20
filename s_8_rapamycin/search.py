from socialgene.cli.search.sea import search_bgc
from socialgene.config import env_vars

env_vars["NEO4J_URI"] = "bolt://localhost:7687"

search_bgc(
    input="/home/chase/Documents/data/mibig/3_1/mibig_gbk_3.1/BGC0001040.gbk",
    hmm_dir="/home/chase/Documents/socialgene_data/v0_4_1/refseq_antismash_bgcs/socialgene_per_run/hmm_cache",
    outpath_clinker="/home/chase/Downloads/clinker/plot/data.json",
    use_neo4j_precalc=True,
    assemblies_must_have_x_matches=0.4,
    nucleotide_sequences_must_have_x_matches=0.4,
    gene_clusters_must_have_x_matches=0.4,
    break_bgc_on_gap_of=20000,
    target_bgc_padding=10000,
    max_domains_per_protein=3,
    max_outdegree=1000000,
    max_query_proteins=5,
    scatter=False,
    locus_tag_bypass_list=None,
    protein_id_bypass_list=["CAA60459.1"],
    only_culture_collection=False,
    frac=0.75,
    run_async=True,
    analyze_with="blastp",
)
