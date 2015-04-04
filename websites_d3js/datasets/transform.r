library(rjson)
library(magrittr)
library(plyr)
fl = list.files()
fl = fl[grep("json", fl)]
# fl %>% file.remove
# fl %>% a_ply(1, function(x){
#   tmp = paste0("../datasets/", x) %>% fromJSON(file = .) %>% as.data.frame %>%
#     as.matrix
#   tmp2 = tmp %>% t() %>% alply(2, lapply, FUN = function(x) x) %>% set_names(NULL)
#   attributes(tmp2) = NULL
#   sink(x); tmp2 %>% toJSON %>% cat; sink()
# })

# to csv file
fl %>% a_ply(1, function(x){
  tmp = fromJSON(file = x) %>% Reduce(rbind, .) %>% write.csv(file = sub(".json", ".csv", x), row.names=F)
})


