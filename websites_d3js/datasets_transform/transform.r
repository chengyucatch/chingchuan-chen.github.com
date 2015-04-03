library(rjson)
library(magrittr)
library(plyr)
fl = list.files("../datasets")
fl = fl[grep("json", fl)]
fl %>% file.remove
fl %>% a_ply(1, function(x){
  tmp = paste0("../datasets/", x) %>% fromJSON(file = .) %>% as.data.frame %>%
    as.matrix
  tmp2 = tmp %>% t() %>% alply(2, lapply, FUN = function(x) x) %>% set_names(NULL)
  attributes(tmp2) = NULL
  sink(x); tmp2 %>% toJSON %>% cat; sink()
})

fl %>% file.remove
fl %>% lapply(function(x){
  tmp = as.list(fromJSON(file = paste("../datasets/", x)))
  sink(x)
  do.call(function(...){
    list(...) %>% {
      lapply(extract2(., 1) %>% seq_along, function(i)
        {lapply(., function(x) x[[i]])})
    } %>% set_names(NULL)
  }, tmp) %>% toJSON %>% cat
  sink()
})