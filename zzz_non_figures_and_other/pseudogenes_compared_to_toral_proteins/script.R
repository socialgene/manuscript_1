library(ggplot2)
library(data.table)
library(plyr)
# data exported from neo4j
a=fread("/home/chase/Downloads/output.csv")
a <- a[a$superkingdom != "", ]
a <- a[a$superkingdom == "Bacteria", ]
outdir <- '/tmp/nprots'



aaaa<- function(a, class_x){

    b = a[a$class == class_x,]
    b <- b[b$genus %in% names(table(b$genus)[table(b$genus)> 100]), ]
    p = ggplot(b) +
        geom_point(aes(x=(n_proteins), y=(n_pseudo), color=genus)) +
        facet_wrap(~genus, scales = "free") +
        theme(legend.position="none") +
        xlab("Number of Proteins") + 
        ylab("Number of Pseudogenes") + theme(axis.text.x = element_text(angle = 45, vjust = 1, hjust=1)) +
        ggtitle(class_x)  +
        theme(plot.title = element_text(hjust = 0.5))
    ggplot2::ggsave(file.path(outdir, paste0(class_x,"_nprot_npseudo.png")), p)
    temp <- b[, median(n_proteins), genus]
    temp <- temp[order(temp$V1, decreasing = T), ]
    b$genus <- factor(b$genus, levels=rev(temp$genus))
    p = ggplot(b) +
        geom_point(aes(x=(n_proteins), y=genus, color=genus), alpha=0.5) +
        theme(legend.position="none") + 
        xlab("Number of Proteins") + 
        geom_vline(xintercept=250, col="purple", alpha = 0.5) +
        scale_x_continuous(breaks=c(seq(0, round_any(max(b$n_proteins), 1000, f = ceiling), 1000), 250)) +
        theme(plot.title = element_text(hjust = 0.5))
    ggplot2::ggsave(file.path(outdir, paste0(class_x,"_nprot.png")), p)
}


for (class_x in unique(a$class)){
    try(aaaa(a, class_x), T)
}

