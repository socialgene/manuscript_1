/// The Cypher code below compares the proteins encoded by BGCs from RefSeq and MIBiG databases and creates links between them if they share at least 70% of their proteins.
:auto MATCH (bgc:nucleotide)
WHERE bgc.external_id STARTS WITH "BGC"
CALL {
  WITH bgc
  MATCH (bgc)-[:ENCODES]->(p0:protein)
  WITH bgc, count(DISTINCT p0) as input_count
  MATCH (bgc)-[:ENCODES]->(p0:protein)<-[:MMSEQS_90]-(:protein)<-[:MMSEQS_70]-(p1:protein)
  MATCH (bgc2:nucleotide)-[e1:ENCODES]->(:protein)<-[:MMSEQS_90]-(:protein)<-[:MMSEQS_70]-(p1)
  WHERE bgc <> bgc2 and not bgc2.external_id STARTS WITH "BGC" AND  e1.antismash_region is not null
  WITH input_count, bgc, bgc2, e1.antismash_region as region, count(DISTINCT p0) as matched_proteins
  WITH input_count, bgc, bgc2, toFloat(matched_proteins) / toFloat(input_count) as score
  WHERE score >= 0.7
  MATCH (bgc)-[:ASSEMBLES_TO]->(a1:assembly)
  MATCH (bgc2)-[:ASSEMBLES_TO]->(a2:assembly)
  CREATE (a1)-[:MIBIG_ANTISMASH_RELATIVES {score:score}]->(a2)

} IN TRANSACTIONS OF 100 ROWS
RETURN 1;

// Add canonical smiles from NP Atlas to MIBiG BGCs
MATCH (a1:assembly)-[r:PRODUCES]->(:npatlas_compound)-[:IS_A]->(c1:chemical_compound)
SET a1.CanonicalSmiles = c1.CanonicalSmiles;

// make culture collection a property of assembly so it can be colored in Gephi
MATCH (n:culture_collection)-[:FOUND_IN]-(a1:assembly) set a1.has_cc = true;


// Export the network to a GraphML file for visualization in Gephi
WITH '
MATCH p=()-[r:MIBIG_ANTISMASH_RELATIVES]->() RETURN p
' AS query
CALL apoc.export.graphml.query(query, "import/network.graphml", {})
YIELD file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data
RETURN file, source, format, nodes, relationships, properties, time, rows, batchSize, batches, done, data;
