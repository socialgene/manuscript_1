:auto 
MATCH z1=(n:pfam {name:"Trp_halogenase"})<-[:SOURCE_DB]-(h1:hmm),
      z2=(h1)-[:ANNOTATES]-(:protein)<-[e1:ENCODES]-(n1:nucleotide)
WHERE n1.external_id STARTS WITH "BGC"
WITH DISTINCT n1, e1
CALL {
    WITH n1, e1
    MATCH z3=(an1:hmm_source:antismash)<-[:SOURCE_DB]-(:hmm)-[:ANNOTATES]->(p1:protein)<-[e2:ENCODES]-(n1)
    MATCH z4=(an2:hmm_source:antismash)<-[:SOURCE_DB]-(:hmm)-[:ANNOTATES]->(p1)
        WHERE an1.name ="Condensation"
            AND an2.name IN ["AMP-binding", "A-OX"] 
            AND abs(e1.start - e2.start) < 10000 
            AND e1.strand = e2.strand
    MATCH z5=(:hmm_source:amrfinder)<-[:SOURCE_DB]-(:hmm)-[:ANNOTATES]->(p2:protein)<-[e3:ENCODES]-(n1)
    WHERE abs(e1.start - e3.start) < 50000 
            AND e1.strand = e3.strand
    RETURN z3, z4, z5
} in transactions of 1 rows
RETURN z1, z2, z3, z4, z5  
  