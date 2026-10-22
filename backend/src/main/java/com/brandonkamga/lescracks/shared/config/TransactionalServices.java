package com.brandonkamga.lescracks.shared.config;

import org.springframework.aop.framework.ProxyFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.interceptor.NameMatchTransactionAttributeSource;
import org.springframework.transaction.interceptor.RuleBasedTransactionAttribute;
import org.springframework.transaction.interceptor.TransactionInterceptor;

import java.util.List;

/**
 * Puts a domain service inside a transaction from the outside.
 *
 * Domain services carry no Spring annotation, so their transaction boundary is declared where
 * the beans are built, by method name: reads run read-only, everything else read-write and
 * rolls back on any runtime exception.
 */
@Component
public class TransactionalServices {

    private static final List<String> READS = List.of("find*", "require*", "list*", "search*", "count*", "view*");

    private final TransactionInterceptor interceptor;

    public TransactionalServices(PlatformTransactionManager transactions) {
        NameMatchTransactionAttributeSource rules = new NameMatchTransactionAttributeSource();
        RuleBasedTransactionAttribute readOnly = new RuleBasedTransactionAttribute();
        readOnly.setReadOnly(true);
        READS.forEach(pattern -> rules.addTransactionalMethod(pattern, readOnly));
        // The most specific pattern wins, so this only catches what no read pattern names.
        rules.addTransactionalMethod("*", new RuleBasedTransactionAttribute());
        this.interceptor = new TransactionInterceptor(transactions, rules);
    }

    public <T> T wrap(Class<T> contract, T service) {
        ProxyFactory factory = new ProxyFactory(service);
        factory.setInterfaces(contract);
        factory.addAdvice(interceptor);
        return contract.cast(factory.getProxy());
    }
}
