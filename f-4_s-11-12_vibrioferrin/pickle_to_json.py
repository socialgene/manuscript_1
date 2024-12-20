import pickle
import pandas as pd
from pathlib import Path
import gzip
from socialgene.clustermap.serialize import SerializeToClustermap
from socialgene.config import env_vars


pickle_path ='BGC0000182.pickle.gz'
json_path = 'clinker.json'

with gzip.open(pickle_path, 'rb') as f:
    search_object = pickle.load(f)


df = search_object.link_df
# group by target_gene_cluster, calculate the mean and media of pident; also count the number of rows
df = df.groupby('target_gene_cluster').agg({'pident': ['mean', 'median', 'count']})
# flatten the multi-index columns
df.columns = ['_'.join(col).strip() for col in df.columns.values]
temp = pd.merge(
            search_object._compare_bgcs_by_jaccard_and_levenshtein(),
            search_object._compare_bgcs_by_median_bitscore(),
            left_on="query_gene_cluster",
            right_on="target_gene_cluster",
            how="inner",
        )
df = pd.merge(df, temp, left_on='target_gene_cluster', right_on='query_gene_cluster_x', how='inner')
df = df.drop(columns=['query_gene_cluster_x', 'target_gene_cluster_x', 'query_gene_cluster_y'])
df.sort_values(by=["modscore", "score"], ascending=False, inplace=True)
df['query_bgc'] = search_object.input_bgc_id
df = df[['query_bgc','target_gene_cluster_y', 'pident_mean', 'pident_median', 'pident_count', 'jaccard', 'levenshtein', 'modscore', 'score']]

df['target_nuc'] = df.target_gene_cluster_y.apply(lambda x: x.parent.external_id)
df['target_ass'] = df.target_gene_cluster_y.apply(lambda x: x.parent.parent.uid)

# limit to matches chosen for the figure in the paper
z=df[df.target_ass.isin(['GCF_002814235.1','GCF_024207115.1'])]

assemblies = [search_object.input_assembly] + [i.parent.parent for i  in z.target_gene_cluster_y.to_list()]

zz = SerializeToClustermap(
    sg_object=search_object.sg_object,
    sorted_bgcs=assemblies,
    link_df=search_object.link_df,
    group_df=search_object.group_df,
)
zz.write(json_path)

